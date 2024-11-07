"use strict";(self.webpackChunkdocumentation=self.webpackChunkdocumentation||[]).push([[1503],{4167:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>c,contentTitle:()=>o,default:()=>h,frontMatter:()=>r,metadata:()=>l,toc:()=>a});var i=s(4848),t=s(8453);const r={},o="Gendox API",l={id:"API/Gendox_API",title:"Gendox API",description:"This guide provides an overview of the main objects within the Gendox platform and how the APIs are structured to interact with these entities.",source:"@site/docs/API/01.Gendox_API.md",sourceDirName:"API",slug:"/API/Gendox_API",permalink:"/gendox-core/docs/API/Gendox_API",draft:!1,unlisted:!1,editUrl:"https://github.com/ctrl-space-labs/gendox-core/tree/main/documentation/docs/API/01.Gendox_API.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Gendox API",permalink:"/gendox-core/docs/category/gendox-api"},next:{title:"Website Widget",permalink:"/gendox-core/docs/category/website-widget"}},c={},a=[{value:"Overview",id:"overview",level:2},{value:"Main Objects",id:"main-objects",level:2},{value:"Users",id:"users",level:3},{value:"Organizations",id:"organizations",level:3},{value:"Projects",id:"projects",level:3},{value:"AI Agents",id:"ai-agents",level:3},{value:"Documents",id:"documents",level:3},{value:"Integrations",id:"integrations",level:3},{value:"API Associations",id:"api-associations",level:2}];function d(e){const n={a:"a",h1:"h1",h2:"h2",h3:"h3",header:"header",hr:"hr",li:"li",p:"p",strong:"strong",ul:"ul",...(0,t.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.header,{children:(0,i.jsx)(n.h1,{id:"gendox-api",children:"Gendox API"})}),"\n",(0,i.jsx)(n.p,{children:"This guide provides an overview of the main objects within the Gendox platform and how the APIs are structured to interact with these entities."}),"\n",(0,i.jsx)(n.h2,{id:"overview",children:"Overview"}),"\n",(0,i.jsxs)(n.p,{children:["Gendox is a collaborative platform that enables users to work across multiple ",(0,i.jsx)(n.strong,{children:"Organizations"}),", each housing multiple ",(0,i.jsx)(n.strong,{children:"Projects"}),". A project comprises two primary components:"]}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"AI Agent"}),": An intelligent agent trained on project-specific documents."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Documents"}),": A collection of files and data sources that the AI Agent uses for training."]}),"\n"]}),"\n",(0,i.jsx)(n.p,{children:"Projects can integrate with various external sources\u2014such as S3 buckets, web pages, Git repositories, and FTP servers\u2014to import documents. These integrations facilitate the seamless inclusion of data into projects, allowing AI Agents to be trained effectively."}),"\n",(0,i.jsx)(n.h2,{id:"main-objects",children:"Main Objects"}),"\n",(0,i.jsx)(n.h3,{id:"users",children:"Users"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Description"}),": Individuals who can be part of multiple organizations."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Key APIs"}),":","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"Create, update, and retrieve user profiles."}),"\n",(0,i.jsx)(n.li,{children:"Deactivate users."}),"\n",(0,i.jsx)(n.li,{children:"Manage user roles within organizations."}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"organizations",children:"Organizations"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Description"}),": Collaborative groups that contain projects and users."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Key APIs"}),":","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"Create and update organizations."}),"\n",(0,i.jsx)(n.li,{children:"Deactivate organizations."}),"\n",(0,i.jsx)(n.li,{children:"Manage users within an organization."}),"\n",(0,i.jsx)(n.li,{children:"Assign roles to users."}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"projects",children:"Projects"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Description"}),": Units within organizations that contain AI Agents and documents."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Key APIs"}),":","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"Create and update projects."}),"\n",(0,i.jsx)(n.li,{children:"Deactivate projects."}),"\n",(0,i.jsx)(n.li,{children:"Manage project members."}),"\n",(0,i.jsx)(n.li,{children:"Integrate AI Agents."}),"\n",(0,i.jsx)(n.li,{children:"Handle project-specific documents."}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"ai-agents",children:"AI Agents"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Description"}),": Intelligent agents trained on documents to perform tasks."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Key APIs"}),":","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"Train AI Agents on project documents."}),"\n",(0,i.jsx)(n.li,{children:"Manage AI Agent configurations."}),"\n",(0,i.jsx)(n.li,{children:"Create verifiable presentation offers."}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"documents",children:"Documents"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Description"}),": Data sources imported into projects for AI training."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Key APIs"}),":","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"Create, update, and delete documents."}),"\n",(0,i.jsx)(n.li,{children:"Upload and split documents."}),"\n",(0,i.jsx)(n.li,{children:"Manage document sections."}),"\n",(0,i.jsx)(n.li,{children:"Reorder document sections."}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.h3,{id:"integrations",children:"Integrations"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Description"}),": Connectors to external data sources for importing documents."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Key APIs"}),":","\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"Create and update integrations."}),"\n",(0,i.jsx)(n.li,{children:"Delete integrations."}),"\n",(0,i.jsx)(n.li,{children:"Retrieve integration details."}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"api-associations",children:"API Associations"}),"\n",(0,i.jsx)(n.p,{children:"The APIs are structured around the relationships between these main objects:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"User APIs"}),": Focus on user management across organizations."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Organization APIs"}),": Handle organizational data and user associations."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Project APIs"}),": Manage projects, including AI Agents and project members."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Document APIs"}),": Deal with document lifecycle within projects."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"Integration APIs"}),": Facilitate connections to external data sources."]}),"\n",(0,i.jsxs)(n.li,{children:[(0,i.jsx)(n.strong,{children:"AI Agent APIs"}),": Oversee the training and deployment of AI Agents within projects."]}),"\n"]}),"\n",(0,i.jsx)(n.p,{children:"Each API endpoint is designed to perform specific actions on these objects, enabling a modular and scalable approach to managing resources within Gendox."}),"\n",(0,i.jsx)(n.hr,{}),"\n",(0,i.jsxs)(n.p,{children:["For detailed API endpoints and specifications, please refer to the ",(0,i.jsx)(n.a,{href:"https://dev.gendox.ctrlspace.dev/gendox/api/v1/swagger-ui/index.html",children:"Swagger Documentation"}),"."]})]})}function h(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>o,x:()=>l});var i=s(6540);const t={},r=i.createContext(t);function o(e){const n=i.useContext(r);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:o(e.components),i.createElement(r.Provider,{value:n},e.children)}}}]);