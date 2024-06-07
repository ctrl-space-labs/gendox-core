package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class EmailPreviewController {

    @GetMapping("/emails/preview/invitationToOrganization")
    public String previewEmail(Model model) {
        model.addAttribute("title", "Email Preview");
        model.addAttribute("subtitle", "You have been invited to a Gendox Organization!");
        model.addAttribute("inviterName", "John Doe");
        model.addAttribute("organizationName", "Gendox Corp");
        model.addAttribute("invitationLink", "https://example.com/invitation");
        model.addAttribute("emailTo", "recipient@example.com");

        return "emails/invitationToOrganization";
    }
}