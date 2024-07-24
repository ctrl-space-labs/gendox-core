package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.core.util.StringUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QWalletKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WalletKeyCriteria;

import java.util.List;
import java.util.UUID;
import com.querydsl.core.types.Predicate;

public class WalletKeyPredicates {

    private static QWalletKey qWalletKey = QWalletKey.walletKey;


    public static Predicate build(WalletKeyCriteria criteria) {
        return ExpressionUtils.allOf(
                organizationId(criteria.getOrganizationId()),
                walletKeyIdIn(criteria.getWalletKeyIdIn())
        );
    }

    private static com.querydsl.core.types.Predicate organizationId(String organizationId) {
        if (StringUtils.isNullOrEmpty(organizationId)) {
            return null;
        }
        return qWalletKey.organizationId.eq(UUID.fromString(organizationId));
    }


    private static com.querydsl.core.types.Predicate walletKeyIdIn(List<String> walletKeyIdIn) {
        if (walletKeyIdIn == null || walletKeyIdIn.isEmpty()) {
            return null;
        }
        return qWalletKey.id.in(walletKeyIdIn.stream().map(UUID::fromString).toArray(UUID[]::new));
    }


}
