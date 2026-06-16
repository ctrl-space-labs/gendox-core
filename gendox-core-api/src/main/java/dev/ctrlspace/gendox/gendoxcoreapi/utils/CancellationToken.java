package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import java.util.function.Supplier;

public class CancellationToken {

    private final Supplier<Boolean> cancelledCheck;

    public CancellationToken(Supplier<Boolean> cancelledCheck) {
        this.cancelledCheck = cancelledCheck;
    }

    public boolean isCancelled() {
        return cancelledCheck.get();
    }
}
