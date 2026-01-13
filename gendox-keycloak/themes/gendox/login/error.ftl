<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>

    <#if section = "header">
        <#-- Κενό Header -->
    <#elseif section = "form">

        <style>
            /* 1. Hide Template Headers */
            header, .kc-form-header, .pf-c-login__main-header, .logo-container, .title-container { display: none !important; }

            /* 2. Custom Header inside form */
            #kc-form .logo-container, #kc-form .title-container { display: block !important; }

            /* 3. General Styles */
            .error-message {
                color: #aab2bd;
                font-size: 14px;
                margin-bottom: 20px;
                line-height: 1.5;
            }
        </style>

        <div id="kc-form">
            <div id="kc-form-wrapper">

                <#-- CUSTOM HEADER -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <div class="logo-container" style="margin-bottom: 20px;">
                        <img src="${url.resourcesPath}/img/gendoxLogo.png" alt="Logo" style="max-width: 100px;">
                    </div>
                    <div class="title-container">
                        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #fff;">Whoops!</h1>
                        <p class="subtitle" style="color: #ff6b6b; font-size: 16px;">Something went wrong</p>
                    </div>
                </div>

                <div style="text-align: center;">
                    <#-- ERROR MESSAGE -->
                    <div class="error-message">
                        <#if message.summary??>
                            ${message.summary}
                        <#else>
                            An unexpected error occurred. Please try again later.
                        </#if>
                    </div>

                    <#-- BACK BUTTON -->
                    <div id="kc-form-buttons" style="margin-top: 25px;">
                        <#if client?? && client.baseUrl?has_content>
                            <a href="${client.baseUrl}" style="text-decoration: none;">
                                <button class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                        type="button"
                                        style="background-color: #00d68f; border: none; color: #ffffff; font-weight: bold; width: 100%; padding: 12px; border-radius: 5px; cursor: pointer;">
                                    Back to Application
                                </button>
                            </a>
                        <#else>
                            <a href="${url.loginUrl}" style="text-decoration: none;">
                                <button class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                                        type="button"
                                        style="background-color: #00d68f; border: none; color: #ffffff; font-weight: bold; width: 100%; padding: 12px; border-radius: 5px; cursor: pointer;">
                                    Back to Login
                                </button>
                            </a>
                        </#if>
                    </div>
                </div>

            </div>
        </div>
    </#if>
</@layout.registrationLayout>