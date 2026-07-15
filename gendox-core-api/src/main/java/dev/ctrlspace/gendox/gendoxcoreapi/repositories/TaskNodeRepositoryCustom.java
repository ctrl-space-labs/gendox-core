package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;

import java.util.List;

public interface TaskNodeRepositoryCustom {

    /**
     * Lightweight alternative to a full criteria fetch that avoids hydrating full
     * {@code TaskNode} entities. A single query projects only {@code id}, {@code nodeType.name}
     * and the {@code node_value->>'order'} page number, which is enough both to check which
     * pages already exist and, if needed, to delete those exact nodes by id afterwards.
     */
    List<TaskNode> findExistingAnswerNodesLite(TaskNodeCriteria criteria);
}
