package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.gendoxcoreapi.model.RolePermission;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.RolePermissionCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.RolePermissionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.RolePermissionPredicates;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RolePermissionService {


    private RolePermissionRepository rolePermissionRepository;

    public RolePermissionService(RolePermissionRepository rolePermissionRepository) {
        this.rolePermissionRepository = rolePermissionRepository;
    }

    public List<RolePermission> getAll(RolePermissionCriteria criteria) {
        return getAll(criteria, Pageable.unpaged());
    }

//    public List<RolePermission> getAll(RolePermissionCriteria criteria, Pageable pageable) {
//        return rolePermissionRepository.findAll(RolePermissionPredicates.build(criteria), pageable).toList();
//    }

    public List<RolePermission> getAll(RolePermissionCriteria criteria, Pageable pageable) {
        Predicate predicate = RolePermissionPredicates.build(criteria);

        // Handle the case where the predicate is null
        if (predicate == null) {
            return rolePermissionRepository.findAll(pageable).toList(); // Fetch all without filtering
        }

        return rolePermissionRepository.findAll(predicate, pageable).toList();
    }

    /**
     * Get role to permission mapping for given role ids
     * eg: {
     *          ROLE_ADMIN: [READ, WRITE, DELETE],
     *          ROLE_READER: [READ],
     *          ROLE_SUPER_ADMIN: [READ, WRITE, DELETE, CREATE]
     *      }
     *
     * @param criteria
     * @return
     */
    public Map<String, List<String>> getRoleToPermissionMapping(RolePermissionCriteria criteria) {
        return getAll(criteria).stream()
                .collect(
                        Collectors.groupingBy(rolePermission -> rolePermission.getRole().getName(),
                                Collectors.mapping(rolePermission -> rolePermission.getPermission().getName(), Collectors.toList())));
    }
}
