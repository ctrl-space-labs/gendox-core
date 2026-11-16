package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.EncryptedJsonConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.EncryptedStringConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecretCipher;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.metamodel.EntityType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * The encrypted columns as they are stored, for the status of the keys and for
 * moving values to a new key. Everything else reads them through the entities,
 * which only ever show the decrypted value.
 *
 * <p>The columns are the entity fields that carry {@link EncryptedStringConverter}
 * or {@link EncryptedJsonConverter}, so a new encrypted field needs nothing here.
 * The table and column names in the SQL come from the entities' annotations,
 * never from a request.
 */
@Repository
public class SecretColumnRepository {

    /** An encrypted column. In a {@code jsonb} column an encrypted value is a JSON string. */
    public record SecretColumn(String table, String id, String column, boolean json) {

        /** The stored text: {@code #>> '{}'} gives the text of a JSON string */
        private String value() {
            return json ? column + " #>> '{}'" : column;
        }

        private String newValue() {
            return json ? "to_jsonb(cast(? as text))" : "?";
        }
    }

    public record StoredSecret(UUID id, String secret) {
    }

    private final JdbcTemplate jdbcTemplate;
    private final List<SecretColumn> columns = new ArrayList<>();

    public SecretColumnRepository(JdbcTemplate jdbcTemplate, EntityManagerFactory entityManagerFactory) {
        this.jdbcTemplate = jdbcTemplate;
        for (EntityType<?> entity : entityManagerFactory.getMetamodel().getEntities()) {
            Class<?> type = entity.getJavaType();
            String id = null;
            List<Field> secrets = new ArrayList<>();
            for (Field field : type.getDeclaredFields()) {
                Column column = field.getAnnotation(Column.class);
                Convert convert = field.getAnnotation(Convert.class);
                if (column != null && field.isAnnotationPresent(Id.class)) {
                    id = column.name();
                }
                if (convert != null && (convert.converter() == EncryptedStringConverter.class
                        || convert.converter() == EncryptedJsonConverter.class)) {
                    secrets.add(field);
                }
            }
            Table table = type.getAnnotation(Table.class);
            for (Field secret : secrets) {
                Column column = secret.getAnnotation(Column.class);
                if (table == null || id == null || column == null) {
                    throw new IllegalStateException(type.getSimpleName()
                            + " has an encrypted field: it needs @Table, an @Id with @Column, and @Column on the field");
                }
                columns.add(new SecretColumn(quote(table.schema()) + "." + quote(table.name()), quote(id),
                        quote(column.name()), secret.getAnnotation(Convert.class).converter() == EncryptedJsonConverter.class));
            }
        }
    }

    private static String quote(String name) {
        return "\"" + name + "\"";
    }

    public List<SecretColumn> columns() {
        return columns;
    }

    /** How many stored values each key holds; the key is null for values stored as they are */
    public Map<String, Long> countPerKey() {
        Map<String, Long> counts = new HashMap<>();
        for (SecretColumn c : columns) {
            jdbcTemplate.query("SELECT CASE WHEN " + c.value() + " LIKE ? THEN split_part(" + c.value() + ", ':', 3) END, count(*)"
                            + " FROM " + c.table() + " WHERE " + c.column() + " IS NOT NULL GROUP BY 1",
                    row -> {
                        counts.merge(row.getString(1), row.getLong(2), Long::sum);
                    },
                    SecretCipher.PREFIX + "%");
        }
        return counts;
    }

    /**
     * The next stored values of a column that are not encrypted with the current key, in the order of their id.
     *
     * @param onCurrentKey the LIKE pattern of a value that the current key encrypted
     */
    public List<StoredSecret> findNotOnKey(SecretColumn c, String onCurrentKey, UUID afterId, int limit) {
        return jdbcTemplate.query("SELECT " + c.id() + ", " + c.value() + " FROM " + c.table()
                        + " WHERE " + c.value() + " NOT LIKE ? AND " + c.id() + " > ? ORDER BY " + c.id() + " LIMIT ?",
                (row, i) -> new StoredSecret(row.getObject(1, UUID.class), row.getString(2)),
                onCurrentKey, afterId, limit);
    }

    /**
     * Replaces a stored value, only if it is still the one that was read.
     *
     * @return 1 when it was replaced, 0 when somebody changed it meanwhile
     */
    public int update(SecretColumn c, UUID id, String oldSecret, String newSecret) {
        return jdbcTemplate.update("UPDATE " + c.table() + " SET " + c.column() + " = " + c.newValue()
                        + " WHERE " + c.id() + " = ? AND " + c.value() + " = ?",
                newSecret, id, oldSecret);
    }
}
