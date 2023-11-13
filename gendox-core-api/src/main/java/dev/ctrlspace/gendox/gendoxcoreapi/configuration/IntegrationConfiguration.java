//package dev.ctrlspace.gendox.gendoxcoreapi.configuration;
//
//
//import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
//import dev.ctrlspace.gendox.gendoxcoreapi.services.UploadService;
//import dev.ctrlspace.gendox.gendoxcoreapi.services.integration.GitIntegrationService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.integration.annotation.InboundChannelAdapter;
//import org.springframework.integration.annotation.IntegrationComponentScan;
//import org.springframework.integration.annotation.Poller;
//import org.springframework.integration.annotation.ServiceActivator;
//import org.springframework.integration.config.EnableIntegration;
//import org.springframework.integration.channel.DirectChannel;
//import org.springframework.integration.core.MessageSource;
//import org.springframework.integration.dsl.IntegrationFlow;
//import org.springframework.integration.dsl.IntegrationFlows;
//import org.springframework.integration.dsl.MessageChannels;
//import org.springframework.integration.dsl.core.Pollers;
//import org.springframework.integration.dsl.support.GenericHandler;
//import org.springframework.integration.endpoint.MethodInvokingMessageSource;
//import org.springframework.integration.file.FileReadingMessageSource;
//import org.springframework.integration.file.FileWritingMessageHandler;
//import org.springframework.integration.file.filters.CompositeFileListFilter;
//import org.springframework.integration.file.filters.SimplePatternFileListFilter;
//import org.springframework.integration.scheduling.PollerMetadata;
//import org.springframework.integration.support.MessageBuilder;
//import org.springframework.messaging.MessageChannel;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.File;
//import java.util.List;
//import java.util.Map;
//
//
//@Configuration
//@EnableIntegration
//public class IntegrationConfiguration {
//    @Autowired
//    private GitIntegrationService gitService;
//
//    @Autowired
//    private UploadService uploadService;
//
//    @Bean
//    public PollerMetadata defaultPoller() {
//        return Pollers.fixedDelay(30000) // Poll every 30 seconds
//                .get();
//    }
//
//    @Bean
//    public IntegrationFlow gitIntegrationFlow() {
//        // Define the message source and handler
//        MethodInvokingMessageSource source = new MethodInvokingMessageSource();
//        source.setObject(gitService);
//        source.setMethodName("checkForUpdates");
//
//        return IntegrationFlows
//                .from(source, c -> c.poller(defaultPoller()))
//                .handle(new GenericHandler<List<MultipartFile>>() {
//                    @Override
//                    public Object handle(List<MultipartFile> files, Map<String, Object> headers) {
//                        // Assuming you have an UploadService bean with a method to handle file uploads
//                        for (MultipartFile file : files) {
//                            try {
////                                uploadService.uploadFile(file, organizationId, projectId);
//                                System.out.println(file.toString());
//                            } catch (Exception e) {
//                                // Properly handle exceptions, for example, logging them
//                                e.printStackTrace();
//                            }
//                        }
//                        return null; // Since this is the end of the integration flow
//                    }
//                })
//                .get();
//    }
//
////    @Bean
////    public IntegrationFlow integrationFlow() {
////        MessageSource<Integration> integrationMessageSource = MessageBuilder.withPayload(gitService.checkIntegrations()).build();
////
////        IntegrationFlow flow = IntegrationFlow
////                .from(integrationMessageSource, p -> p.poller(defaultPoller()))
////                .handle(new GenericHandler<Integration>(){
////                    @Override
////                    public Object handle(Integration payload, Map<String, Object> headers) {
////                        // Handle the message here. This can be a logging operation or further processing.
////                        // Implement your logic based on the payload (list of integrations)
////                        return null; // return value depends on your processing logic
////                    }
////                })
////                .get();
////
////        return flow;
////    }
//
////
////    @Bean
////    @InboundChannelAdapter(value = "fileInputChannel", poller = @Poller(fixedDelay = "1000"))
////    public FileReadingMessageSource fileReadingMessageSource() {
////        CompositeFileListFilter<File> filter = new CompositeFileListFilter<>();
////        filter.addFilter(new SimplePatternFileListFilter("*.txt"));
////        FileReadingMessageSource reader = new FileReadingMessageSource();
////        reader.setDirectory(new File(""));
////        reader.setFilter(filter); // all txt files
////        return reader;
////    }
////
////    @Bean
////    @ServiceActivator(inputChannel = "fileInputChannel")
////    public FileWritingMessageHandler fileWritingMessageHandler() {
////        FileWritingMessageHandler writer = new FileWritingMessageHandler(new File(""));
////        writer.setAutoCreateDirectory(true);
////        writer.setExpectReply(false);
////        return writer;
////    }
////
////    @Bean
////    public MessageChannel recieverChannel() {
////        return new DirectChannel();
////    }
////
////    @Bean
////    public MessageChannel replyChannel() {
////        return new DirectChannel();
////    }
////
//
//
//
//
//
//
////    @Bean
////    public IntegrationFlow gitIntegrationFlow() {
////        // Define the MessageSource
////        MessageSource<List<Integration>> gitIntegrationSource = () -> MessageBuilder.withPayload(gitService.checkIntegrations()).build();
////        // Define the IntegrationFlow
////        IntegrationFlow flow = IntegrationFlows
////                .from(gitIntegrationSource, c -> c.poller(defaultPoller()))
////                .transform()
////                .filter()
////                .handle((GenericHandler<String>) (payload, headers) -> payload.contains("hola") ? payload : null)
////                .handle(new GenericHandler<List<Integration>>() {
////                    @Override
////                    public Object handle(List<Integration> payload, Map<String, Object> headers) {
////                        // Handle the message here. This can be a logging operation or further processing.
////                        // Implement your logic based on the payload (list of integrations)
////                        return null; // return value depends on your processing logic
////                    }
////                })
////                .get();
////        return flow;
////    }
////    @Bean
////    public List<IntegrationFlow> integrations() {
////        List<Integration> integration = query....
////        List<IntegrationFlow> flows = new ArrayList...
////        for each integration {
////            IntegrationFlow flow = IntegrationFlows.from(integration, poller.every(10minutes)).handle(() = > {....}).
////            get();
////            flows.add(flow);
////        }
////
////        // ApplicationContextHolder.addBeans(flows);
////        return flows;
////
////    }
//}
//
