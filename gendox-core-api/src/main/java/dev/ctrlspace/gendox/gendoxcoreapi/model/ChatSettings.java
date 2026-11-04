package dev.ctrlspace.gendox.gendoxcoreapi.model;

import java.util.List;

/**
 * How an agent's chat looks to the people who use it, edited under Deploy (#527): the website widget,
 * the agent home and Try it. Stored as JSON in project_agent.chat_settings; every field is optional.
 *
 * @param welcomeMessage     the first thing visitors read
 * @param suggestedQuestions questions offered before the first message, sent with one click
 * @param theme              LIGHT, DARK or AUTO (the visitor's device)
 * @param accentColor        #RRGGBB, or #RRGGBBAA with transparency
 * @param backgroundColor    #RRGGBB, or #RRGGBBAA with transparency
 * @param bubbleText         the text beside the closed widget bubble
 * @param disclaimer         shown under the message box
 * @param branding           the "Powered by Gendox" line: STANDARD, SMALL or NONE; only Gendox sets NONE
 */
public record ChatSettings(String welcomeMessage,
                           List<String> suggestedQuestions,
                           String theme,
                           String accentColor,
                           String backgroundColor,
                           String bubbleText,
                           String disclaimer,
                           String branding) {
}
