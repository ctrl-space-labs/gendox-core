package dev.ctrlspace.gendox.spring.batch.jobs.demojob.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.batch.item.ItemReader;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@StepScope
public class DemoReader implements ItemReader<String> {


    List<String> docs = List.of("a.txt", "b.txt", "c.txt", "d.txt", "e.txt", "f.txt", "g.txt", "h.txt", "i.txt", "j.txt");
    int index = -1;

    @Override
    public String read() throws Exception {

        index++;
        if (index >= docs.size()) {
            return null;
        }

        return docs.get(index);
    }
}
