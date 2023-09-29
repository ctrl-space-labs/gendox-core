package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.EmbeddingGroup;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.EmbeddingGroupDTO;
import org.springframework.stereotype.Component;

@Component
public class EmbeddingGroupConverter implements GendoxConverter<EmbeddingGroup, EmbeddingGroupDTO> {
    @Override
    public EmbeddingGroupDTO toDTO(EmbeddingGroup embeddingGroup) {
        EmbeddingGroupDTO embeddingGroupDTO = new EmbeddingGroupDTO();

        embeddingGroupDTO.setId(embeddingGroup.getId());
        embeddingGroupDTO.setSectionId(embeddingGroup.getSectionId());
        embeddingGroupDTO.setMessageId(embeddingGroup.getMessageId());
        embeddingGroupDTO.setEmbeddingId(embeddingGroup.getEmbeddingId());
        embeddingGroupDTO.setTokenCount(embeddingGroup.getTokenCount());
        embeddingGroupDTO.setGroupingStrategyTypeId(embeddingGroup.getGroupingStrategyType());
        embeddingGroupDTO.setSemanticSearchModelId(embeddingGroup.getSemanticSearchModelId());

        return embeddingGroupDTO;
    }

    @Override
    public EmbeddingGroup toEntity(EmbeddingGroupDTO embeddingGroupDTO) {
        EmbeddingGroup embeddingGroup = new EmbeddingGroup();

        embeddingGroup.setId(embeddingGroupDTO.getId());
        embeddingGroup.setSectionId(embeddingGroupDTO.getSectionId());
        embeddingGroup.setMessageId(embeddingGroupDTO.getMessageId());
        embeddingGroup.setEmbeddingId(embeddingGroupDTO.getEmbeddingId());
        embeddingGroup.setTokenCount(embeddingGroupDTO.getTokenCount());
        embeddingGroup.setGroupingStrategyType(embeddingGroupDTO.getGroupingStrategyTypeId());
        embeddingGroup.setSemanticSearchModelId(embeddingGroupDTO.getSemanticSearchModelId());

        return embeddingGroup;
    }
}
