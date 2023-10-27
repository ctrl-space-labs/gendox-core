package dev.ctrlspace.gendox.gendoxcoreapi.discord.post.records;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;

import java.util.List;


public record SearchMessagePost(List<DocumentInstanceSection> sections) {
}
