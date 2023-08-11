package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserOrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.UserOrganizationPredicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserOrganizationService {

    private UserOrganizationRepository userOrganizationRepository;

    @Autowired
    public UserOrganizationService(UserOrganizationRepository userOrganizationRepository) {
        this.userOrganizationRepository = userOrganizationRepository;
    }

    public List<UserOrganization> getAll(UserOrganizationCriteria criteria) {
        return getAll(criteria, Pageable.unpaged());
    }

    public List<UserOrganization> getAll(UserOrganizationCriteria criteria, Pageable pageable) {
        return userOrganizationRepository.findAll(UserOrganizationPredicate.build(criteria), pageable).toList();

    }
}
