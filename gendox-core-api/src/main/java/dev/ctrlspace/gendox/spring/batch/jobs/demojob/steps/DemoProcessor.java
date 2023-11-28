package dev.ctrlspace.gendox.spring.batch.jobs.demojob.steps;

import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

@Component
@StepScope
public class DemoProcessor implements ItemProcessor<String, Integer> {

    @Override
    public Integer process(String item) throws Exception {

        return item.length();
    }
}
