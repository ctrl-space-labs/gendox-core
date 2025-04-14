"use strict";(self.webpackChunkdocumentation=self.webpackChunkdocumentation||[]).push([[2392],{6363:(e,n,i)=>{i.r(n),i.d(n,{assets:()=>a,contentTitle:()=>o,default:()=>h,frontMatter:()=>s,metadata:()=>d,toc:()=>l});var t=i(4848),r=i(8453);const s={},o="Gendox Integration",d={id:"Integrations/Integrations_Types",title:"Gendox Integration",description:"Overview",source:"@site/docs/04-Integrations/01.Integrations_Types.md",sourceDirName:"04-Integrations",slug:"/Integrations/Integrations_Types",permalink:"/gendox-core/Integrations/Integrations_Types",draft:!1,unlisted:!1,editUrl:"https://github.com/ctrl-space-labs/gendox-core/tree/main/documentation/docs/04-Integrations/01.Integrations_Types.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Import Data Integrations",permalink:"/gendox-core/category/import-data-integrations"},next:{title:"Integration AWS S3 Bucket Configuration",permalink:"/gendox-core/Integrations/Integration_AWS_S3_Bucket_conf"}},a={},l=[{value:"Overview",id:"overview",level:2},{value:"1. Introduction",id:"1-introduction",level:2},{value:"2. Supported Integrations",id:"2-supported-integrations",level:2},{value:"2.1 Git Integration",id:"21-git-integration",level:3},{value:"2.2 Dropbox Integration (not available yet)",id:"22-dropbox-integration-not-available-yet",level:3},{value:"2.3 Google Drive Integration (not available yet)",id:"23-google-drive-integration-not-available-yet",level:3},{value:"2.4 AWS S3 Integration",id:"24-aws-s3-integration",level:3},{value:"3. Configuration and Usage",id:"3-configuration-and-usage",level:2},{value:"3.1 Setting Up Integrations",id:"31-setting-up-integrations",level:3},{value:"3.2 Git Integration Workflow",id:"32-git-integration-workflow",level:3},{value:"4. Understanding Gendox Integration Code",id:"4-understanding-gendox-integration-code",level:2},{value:"4.1 Database Setup",id:"41-database-setup",level:3},{value:"<code>integrations</code> Table Layout",id:"integrations-table-layout",level:3},{value:"Required Columns by Integration Type",id:"required-columns-by-integration-type",level:4},{value:"4.2 Integration Configuration",id:"42-integration-configuration",level:3},{value:"4.3 Integration Services",id:"43-integration-services",level:3},{value:"4.3.1 IntegrationManager Service",id:"431-integrationmanager-service",level:4},{value:"4.3.2 GitIntegrationUpdateService",id:"432-gitintegrationupdateservice",level:4},{value:"4.3.3 S3BucketIntegrationService",id:"433-s3bucketintegrationservice",level:4},{value:"4.4 Service Activators",id:"44-service-activators",level:3},{value:"4.5 File Handling and Processing",id:"45-file-handling-and-processing",level:3},{value:"4.6 Conclusion",id:"46-conclusion",level:3},{value:"5. Advanced Features",id:"5-advanced-features",level:2},{value:"6. Troubleshooting",id:"6-troubleshooting",level:2},{value:"7. Conclusion",id:"7-conclusion",level:2}];function c(e){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",header:"header",img:"img",li:"li",ol:"ol",p:"p",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,r.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.header,{children:(0,t.jsx)(n.h1,{id:"gendox-integration",children:"Gendox Integration"})}),"\n",(0,t.jsx)(n.h2,{id:"overview",children:"Overview"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"Gendox's integration feature facilitates seamless interaction with various external platforms like GitHub, Dropbox, Google Drive, and AWS S3. This documentation provides a comprehensive guide on how to utilize these integrations, focusing particularly on the Git integration."}),"\n",(0,t.jsx)(n.li,{children:"The Gendox integration feature is implemented through a combination of database configurations, Spring Boot services, and integration patterns. It facilitates the management of external integrations, focusing primarily on handling file updates and synchronization."}),"\n"]}),"\n",(0,t.jsx)(n.h2,{id:"1-introduction",children:"1. Introduction"}),"\n",(0,t.jsx)(n.p,{children:"Gendox's integration feature is designed to enhance project management and document handling by connecting Gendox with various third-party services. This feature allows users to import, export, and synchronize files seamlessly."}),"\n",(0,t.jsx)(n.h2,{id:"2-supported-integrations",children:"2. Supported Integrations"}),"\n",(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:"Integration Type"}),(0,t.jsx)(n.th,{children:"Description"})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"Git Integration"}),(0,t.jsx)(n.td,{children:"Connects a Gendox project with a Git repository for automatic synchronization of changes."})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"Dropbox Integration"}),(0,t.jsx)(n.td,{children:"Links Gendox with a Dropbox account, enabling file sharing and management directly from Gendox. (Not available yet)"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"Google Drive Integration"}),(0,t.jsx)(n.td,{children:"Connects Gendox with a Google Drive account for accessing and managing Google Drive files within Gendox. (Not available yet)"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"AWS S3 Integration"}),(0,t.jsx)(n.td,{children:"Facilitates interaction with AWS S3 buckets, allowing users to manage S3 files from Gendox."})]})]})]}),"\n",(0,t.jsx)(n.h3,{id:"21-git-integration",children:"2.1 Git Integration"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"Connects Gendox projects with Git repositories."}),"\n",(0,t.jsx)(n.li,{children:"Facilitates automatic synchronization of changes."}),"\n",(0,t.jsx)(n.li,{children:"Utilizes Spring Integration for handling Git events."}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{alt:"git-flow-diagram.png",src:i(3305).A+"",width:"978",height:"558"})}),"\n",(0,t.jsx)(n.h3,{id:"22-dropbox-integration-not-available-yet",children:"2.2 Dropbox Integration (not available yet)"}),"\n",(0,t.jsx)(n.p,{children:"This integration links Gendox with a Dropbox account, allowing file sharing and management directly from Gendox."}),"\n",(0,t.jsx)(n.h3,{id:"23-google-drive-integration-not-available-yet",children:"2.3 Google Drive Integration (not available yet)"}),"\n",(0,t.jsx)(n.p,{children:"Connect Gendox with a Google Drive account for accessing and managing Google Drive files within Gendox."}),"\n",(0,t.jsx)(n.h3,{id:"24-aws-s3-integration",children:"2.4 AWS S3 Integration"}),"\n",(0,t.jsx)(n.p,{children:"This integration facilitates the interaction with AWS S3 buckets, allowing users to manage S3 files from Gendox."}),"\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{alt:"aws-s3-flow-diagram.png",src:i(9405).A+"",width:"1007",height:"497"})}),"\n",(0,t.jsx)(n.h2,{id:"3-configuration-and-usage",children:"3. Configuration and Usage"}),"\n",(0,t.jsx)(n.h3,{id:"31-setting-up-integrations",children:"3.1 Setting Up Integrations"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.ol,{children:["\n",(0,t.jsx)(n.li,{children:"Choose Integration Type: Select the desired integration type (Git, Dropbox, Google Drive, or AWS S3)."}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.ol,{start:"2",children:["\n",(0,t.jsx)(n.li,{children:"Enter Credentials: Provide the necessary authentication details like URL, directory path, and access credentials."}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.ol,{start:"3",children:["\n",(0,t.jsx)(n.li,{children:"Activate Integration: Enable the integration to start synchronization."}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,t.jsx)(n.h3,{id:"32-git-integration-workflow",children:"3.2 Git Integration Workflow"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.ol,{children:["\n",(0,t.jsx)(n.li,{children:"Repository Connection: Connect a Gendox project with a Git repository."}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.ol,{start:"2",children:["\n",(0,t.jsx)(n.li,{children:"Automatic Pull: Gendox periodically checks for updates in the Git repository."}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.ol,{start:"3",children:["\n",(0,t.jsx)(n.li,{children:"File Synchronization: Updated files are pulled into the Gendox project."}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.ol,{start:"4",children:["\n",(0,t.jsx)(n.li,{children:"Upload and Version Control: Changes made in Gendox can be pushed back to the Git repository."}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,t.jsx)(n.h2,{id:"4-understanding-gendox-integration-code",children:"4. Understanding Gendox Integration Code"}),"\n",(0,t.jsx)(n.h3,{id:"41-database-setup",children:"4.1 Database Setup"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"Types Table:"})," Stores integration types (GIT, Dropbox, etc.)."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"Integrations Table:"})," Holds details about each integration, such as type, project ID, and repository information."]}),"\n"]}),"\n",(0,t.jsxs)(n.h3,{id:"integrations-table-layout",children:[(0,t.jsx)(n.code,{children:"integrations"})," Table Layout"]}),"\n",(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:"Column"}),(0,t.jsx)(n.th,{children:"Data Type"}),(0,t.jsx)(n.th,{children:"Description"})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"id"}),(0,t.jsx)(n.td,{children:"UUID"}),(0,t.jsx)(n.td,{children:"Primary key for the integration"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"project_id"}),(0,t.jsx)(n.td,{children:"UUID"}),(0,t.jsx)(n.td,{children:"ID of the associated project"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"type_id"}),(0,t.jsx)(n.td,{children:"UUID"}),(0,t.jsx)(n.td,{children:"Type of integration (e.g., GitHub, S3, etc.)"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"is_active"}),(0,t.jsx)(n.td,{children:"Boolean"}),(0,t.jsx)(n.td,{children:"Indicates if the integration is active"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"url"}),(0,t.jsx)(n.td,{children:"String"}),(0,t.jsx)(n.td,{children:"URL of the repository or service"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"queue_name"}),(0,t.jsx)(n.td,{children:"String"}),(0,t.jsx)(n.td,{children:"Queue name for S3 integration"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"directory_path"}),(0,t.jsx)(n.td,{children:"String"}),(0,t.jsx)(n.td,{children:"Directory path for GitHub or other integrations"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"repository_head"}),(0,t.jsx)(n.td,{children:"String"}),(0,t.jsx)(n.td,{children:"Head commit for GitHub integration"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"user_name"}),(0,t.jsx)(n.td,{children:"String"}),(0,t.jsx)(n.td,{children:"Username for integrations requiring auth"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"password"}),(0,t.jsx)(n.td,{children:"String"}),(0,t.jsx)(n.td,{children:"Password for authenticated integrations"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"created_at"}),(0,t.jsx)(n.td,{children:"Timestamp"}),(0,t.jsx)(n.td,{children:"When the integration was created"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"updated_at"}),(0,t.jsx)(n.td,{children:"Timestamp"}),(0,t.jsx)(n.td,{children:"When the integration was last updated"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"created_by"}),(0,t.jsx)(n.td,{children:"UUID"}),(0,t.jsx)(n.td,{children:"ID of the user who created the integration"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:"updated_by"}),(0,t.jsx)(n.td,{children:"UUID"}),(0,t.jsx)(n.td,{children:"ID of the user who last updated the integration"})]})]})]}),"\n",(0,t.jsx)(n.h4,{id:"required-columns-by-integration-type",children:"Required Columns by Integration Type"}),"\n",(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{children:"Integration Type"}),(0,t.jsx)(n.th,{children:"Required Columns"})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:"GitHub"})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:"type_id"}),", ",(0,t.jsx)(n.code,{children:"project_id"}),", ",(0,t.jsx)(n.code,{children:"is_active"}),", ",(0,t.jsx)(n.code,{children:"url"}),", ",(0,t.jsx)(n.code,{children:"directory_path"}),", ",(0,t.jsx)(n.code,{children:"repository_head"}),", ",(0,t.jsx)(n.code,{children:"updated_at"})]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:"S3"})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:"type_id"}),", ",(0,t.jsx)(n.code,{children:"project_id"}),", ",(0,t.jsx)(n.code,{children:"is_active"}),", ",(0,t.jsx)(n.code,{children:"queue_name"})]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:"Dropbox"})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:"type_id"}),", ",(0,t.jsx)(n.code,{children:"project_id"}),", ",(0,t.jsx)(n.code,{children:"is_active"}),", ",(0,t.jsx)(n.code,{children:"url"}),", ",(0,t.jsx)(n.code,{children:"directory_path"})]})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{children:(0,t.jsx)(n.strong,{children:"Google Drive"})}),(0,t.jsxs)(n.td,{children:[(0,t.jsx)(n.code,{children:"type_id"}),", ",(0,t.jsx)(n.code,{children:"project_id"}),", ",(0,t.jsx)(n.code,{children:"is_active"}),", ",(0,t.jsx)(n.code,{children:"url"}),", ",(0,t.jsx)(n.code,{children:"directory_path"})]})]})]})]}),"\n",(0,t.jsx)(n.h3,{id:"42-integration-configuration",children:"4.2 Integration Configuration"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"IntegrationConfiguration Class:"})," Configures the integration workflow using Spring Integration."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"MessageSource Bean:"})," Triggers the dispatch to integration services at regular intervals."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"MessageChannel Bean:"})," Facilitates message passing between components."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"ServiceActivator Bean:"})," Handles messages from the integration channel."]}),"\n"]}),"\n",(0,t.jsx)(n.h3,{id:"43-integration-services",children:"4.3 Integration Services"}),"\n",(0,t.jsx)(n.h4,{id:"431-integrationmanager-service",children:"4.3.1 IntegrationManager Service"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"Manages dispatching to specific integration services."}),"\n",(0,t.jsx)(n.li,{children:"Collects updates from different integration types."}),"\n"]}),"\n",(0,t.jsx)(n.h4,{id:"432-gitintegrationupdateservice",children:"4.3.2 GitIntegrationUpdateService"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"Checks for updates in Git repositories."}),"\n",(0,t.jsx)(n.li,{children:"Clones or pulls repositories as needed."}),"\n",(0,t.jsx)(n.li,{children:"Handles file transformations to MultipartFile."}),"\n"]}),"\n",(0,t.jsx)(n.h4,{id:"433-s3bucketintegrationservice",children:"4.3.3 S3BucketIntegrationService"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"Facilitates interaction with AWS S3 buckets."}),"\n",(0,t.jsx)(n.li,{children:"Handles file uploads and deletions."}),"\n"]}),"\n",(0,t.jsx)(n.h3,{id:"44-service-activators",children:"4.4 Service Activators"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"MessageHandler:"})," Processes messages from the integration channel."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"Executes file"})," upload and directory cleanup."]}),"\n"]}),"\n",(0,t.jsx)(n.h3,{id:"45-file-handling-and-processing",children:"4.5 File Handling and Processing"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"UploadService:"})," Manages the upload of files to projects."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"deleteDirectoryFiles:"})," Removes obsolete files, excluding hidden directories."]}),"\n"]}),"\n",(0,t.jsx)(n.h3,{id:"46-conclusion",children:"4.6 Conclusion"}),"\n",(0,t.jsx)(n.p,{children:"The Gendox integration code is a sophisticated implementation that combines database management, service-oriented architecture, and Spring Integration patterns. It provides a robust and flexible framework for managing various external integrations, enhancing the functionality and utility of the Gendox platform."}),"\n",(0,t.jsx)(n.h2,{id:"5-advanced-features",children:"5. Advanced Features"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"Batch Jobs:"})," Automate the upload of multiple files."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:"Directory Management:"})," Automatic deletion of obsolete files, excluding hidden directories like ",(0,t.jsx)(n.code,{children:".git"}),"."]}),"\n"]}),"\n",(0,t.jsx)(n.h2,{id:"6-troubleshooting",children:"6. Troubleshooting"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"Ensure that all integration credentials are correct."}),"\n",(0,t.jsx)(n.li,{children:"Check network connectivity for external services."}),"\n",(0,t.jsx)(n.li,{children:"Verify that the repository URL and access paths are correct."}),"\n"]}),"\n",(0,t.jsx)(n.h2,{id:"7-conclusion",children:"7. Conclusion"}),"\n",(0,t.jsx)(n.p,{children:"Gendox's integration feature offers a powerful way to connect your Gendox projects with various external platforms, streamlining project management and document handling. By following this guide, users can efficiently utilize these integrations to enhance their workflow."})]})}function h(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(c,{...e})}):c(e)}},9405:(e,n,i)=>{i.d(n,{A:()=>t});const t=i.p+"assets/images/aws-s3-flow-diagram-6af529505cccb2f474c4b6d5856f92a6.png"},3305:(e,n,i)=>{i.d(n,{A:()=>t});const t=i.p+"assets/images/git-flow-diagram-b04844dce64724b6ff1e6a19232012d5.png"},8453:(e,n,i)=>{i.d(n,{R:()=>o,x:()=>d});var t=i(6540);const r={},s=t.createContext(r);function o(e){const n=t.useContext(s);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:o(e.components),t.createElement(s.Provider,{value:n},e.children)}}}]);