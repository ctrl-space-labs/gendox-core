package dev.ctrlspace.gendox.spring.batch.jobs.demojob.steps;

import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.stereotype.Component;

@Component
@StepScope
public class DemoWriter implements ItemWriter<Integer> {

    @Override
    public void write(Chunk<? extends Integer> chunk) throws Exception {
        System.out.println("chunk = " + chunk.size());

        for (Integer item : chunk.getItems()) {
            System.out.println("item = " + item);
        }
    }
}
