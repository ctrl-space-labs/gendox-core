package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class SubscriptionNotificationDTO {
    private String productSKU;
    private String email;
    private Integer numberOfSeats;
    private Instant startDate;
    private Instant endDate;
    private String status;

}
