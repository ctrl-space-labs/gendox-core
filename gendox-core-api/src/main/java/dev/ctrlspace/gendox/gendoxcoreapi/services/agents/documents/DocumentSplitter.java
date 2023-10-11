package dev.ctrlspace.gendox.gendoxcoreapi.services.agents.documents;

import java.util.List;

public interface DocumentSplitter {

    public List<String> split(String document);

}
