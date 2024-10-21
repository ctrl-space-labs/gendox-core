"use strict";(self.webpackChunkdocumentation=self.webpackChunkdocumentation||[]).push([[6590],{512:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>d,contentTitle:()=>r,default:()=>h,frontMatter:()=>o,metadata:()=>a,toc:()=>l});var i=n(4848),s=n(8453);const o={},r="Installation",a={id:"Website Widget/Instalation",title:"Installation",description:"Introduction",source:"@site/docs/Website Widget/01. Instalation.md",sourceDirName:"Website Widget",slug:"/Website Widget/Instalation",permalink:"/gendox-core/docs/Website Widget/Instalation",draft:!1,unlisted:!1,editUrl:"https://github.com/ctrl-space-labs/gendox-core/tree/main/documentation/docs/Website Widget/01. Instalation.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Website Widget",permalink:"/gendox-core/docs/category/website-widget"},next:{title:"Import Data Integrations",permalink:"/gendox-core/docs/category/import-data-integrations"}},d={},l=[{value:"Introduction",id:"introduction",level:2},{value:"Getting Started",id:"getting-started",level:2},{value:"Installation",id:"installation-1",level:2},{value:"Configuration",id:"configuration",level:2},{value:"1. Styling",id:"1-styling",level:3},{value:"2. Parameters",id:"2-parameters",level:3},{value:"Events",id:"events",level:2},{value:"Table of Events",id:"table-of-events",level:3}];function c(e){const t={code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",header:"header",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,s.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(t.header,{children:(0,i.jsx)(t.h1,{id:"installation",children:"Installation"})}),"\n",(0,i.jsx)(t.h2,{id:"introduction",children:"Introduction"}),"\n",(0,i.jsx)(t.p,{children:"The Gendox Chat Widget is the easiest way to integrate an AI chat system into your website, enabling direct integration with popular AI models such as OpenAI ChatGPT, Cohere, LLaMA, and others. This widget allows you to add advanced chatbot capabilities to your platform with minimal setup."}),"\n",(0,i.jsx)(t.h2,{id:"getting-started",children:"Getting Started"}),"\n",(0,i.jsx)(t.p,{children:"To begin using the Gendox Chat Widget, you must first create an account on the Gendox platform. Follow these steps:"}),"\n",(0,i.jsxs)(t.ol,{children:["\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:"Create a Gendox Account"}),"."]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:"Create a Project and an Agent"})," [link to guide]."]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:"Upload Information"})," [link to guide]."]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:"Make the Project Public"}),". ",(0,i.jsx)(t.em,{children:"(This step is crucial for the widget to function properly)"}),"."]}),"\n"]}),"\n",(0,i.jsxs)(t.p,{children:["Once your agent has been created, navigate to the ",(0,i.jsx)(t.strong,{children:"Gendox webapp homepage"}),", click on your project, and retrieve the following from the browser's URL parameters:"]}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsx)(t.li,{children:(0,i.jsx)(t.code,{children:"organizationId"})}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.code,{children:"projectId"}),"."]}),"\n"]}),"\n",(0,i.jsx)(t.h2,{id:"installation-1",children:"Installation"}),"\n",(0,i.jsxs)(t.p,{children:["To install the Gendox widget on any website, simply add the following script to the ",(0,i.jsx)(t.code,{children:"<head>"})," section of your webpage:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-html",children:'<script\n    id="gendox-chat-script"\n    src="https://gendox.ctrlspace.dev/gendox-sdk/gendox-widget-plugin.js"\n    data-trusted-origin="https://gendox.ctrlspace.dev"\n    data-organization-id="[organizationId]"\n    data-project-id="[projectId]">\n<\/script>\n'})}),"\n",(0,i.jsx)(t.p,{children:"Once this script is included, the Gendox widget will automatically appear in the bottom-right corner of your page."}),"\n",(0,i.jsx)(t.h2,{id:"configuration",children:"Configuration"}),"\n",(0,i.jsx)(t.h3,{id:"1-styling",children:"1. Styling"}),"\n",(0,i.jsxs)(t.p,{children:["You can easily customize the appearance and position of the Gendox chat widget by overriding its default CSS styles using ",(0,i.jsx)(t.strong,{children:"CSS specificity"}),". For example, you can adjust the location of the chat bubble or window using the following CSS:"]}),"\n",(0,i.jsx)(t.pre,{children:(0,i.jsx)(t.code,{className:"language-css",children:"#gendox-chat-container-id.gendox-chat-container-position {\n    position: fixed;\n    bottom: 2rem;\n    right: 1rem;\n    z-index: 1000;\n    border-radius: 20px;\n}\n"})}),"\n",(0,i.jsx)(t.h3,{id:"2-parameters",children:"2. Parameters"}),"\n",(0,i.jsx)(t.p,{children:"The following parameters can be customized by passing them into the script:"}),"\n",(0,i.jsxs)(t.ul,{children:["\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:"trustedOrigin"}),": The origin to ensure secure communication."]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:"organizationId"}),": The ID of your Gendox organization."]}),"\n",(0,i.jsxs)(t.li,{children:[(0,i.jsx)(t.strong,{children:"projectId"}),": The ID of the specific project."]}),"\n"]}),"\n",(0,i.jsx)(t.p,{children:"More parameter configurations will be documented in future updates."}),"\n",(0,i.jsx)(t.h2,{id:"events",children:"Events"}),"\n",(0,i.jsxs)(t.p,{children:["The Gendox widget uses the ",(0,i.jsx)(t.strong,{children:"Post Message API"})," to exchange messages between the widget and the parent webpage. Developers can set up event listeners to receive notifications from the Gendox chat app and send information back to it."]}),"\n",(0,i.jsx)(t.h3,{id:"table-of-events",children:"Table of Events"}),"\n",(0,i.jsxs)(t.table,{children:[(0,i.jsx)(t.thead,{children:(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.th,{children:"Event Type"}),(0,i.jsx)(t.th,{children:"Description"})]})}),(0,i.jsxs)(t.tbody,{children:[(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:"GENDOX_EVENTS_INITIALIZATION_REQUEST"}),(0,i.jsx)(t.td,{children:"Gendox requests initial configuration from the parent website."})]}),(0,i.jsxs)(t.tr,{children:[(0,i.jsx)(t.td,{children:"GENDOX_EVENTS_MESSAGE_RESPONSE_RECEIVE"}),(0,i.jsx)(t.td,{children:"The agent sends a response message back to the user."})]})]})]})]})}function h(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,i.jsx)(t,{...e,children:(0,i.jsx)(c,{...e})}):c(e)}}}]);