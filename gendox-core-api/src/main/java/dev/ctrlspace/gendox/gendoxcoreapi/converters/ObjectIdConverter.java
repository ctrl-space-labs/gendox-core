package dev.ctrlspace.gendox.gendoxcoreapi.converters;



import org.eclipse.jgit.lib.ObjectId;
import org.springframework.stereotype.Component;

@Component
public class ObjectIdConverter {

    public String convertToDatabaseColumnString(ObjectId attribute) {
        if (attribute != null) {
            return attribute.getName();
        }
        return null;
    }

    public ObjectId convertToEntityAttribute(String dbData) {
        if (dbData != null && !dbData.isEmpty()) {
            return ObjectId.fromString(dbData);
        }
        return null;
    }

}

