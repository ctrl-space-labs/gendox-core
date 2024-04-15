package dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications;

import com.querydsl.core.types.ExpressionUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QProject;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.WalletKeyCriteria;

import java.util.function.Predicate;

public class WalletKeyPredicates {

    private static QWalletKey qWalletKey = QWalletKey.walletKey;


    public static Predicate build(WalletKeyCriteria criteria) {
        return ExpressionUtils.allOf(
                organizationId(criteria.getOrganizationId()),
                walletKeyIdIn(criteria.getWalletKeyIdIn())
        );
    }









}
