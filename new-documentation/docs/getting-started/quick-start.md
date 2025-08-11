---
sidebar_position: 4
---

# Quick Start Guide

Get your first AI agent up and running in 10 minutes! This guide walks you through creating an intelligent chatbot trained on your documents.

## What You'll Build

By the end of this guide, you'll have:
- ✅ A working AI agent trained on your documents
- ✅ A chat interface to test your agent
- ✅ Understanding of how to customize and deploy your agent

## Prerequisites

Before starting, ensure you have:
- A web browser (Chrome, Firefox, Safari, or Edge)
- 2-5 PDF, Word, or text documents you want to train your agent on
- An email address for account creation

## Step 1: Create Your Account

### Sign Up

1. Go to **[app.gendox.dev](https://app.gendox.dev)**
2. Click **"Sign Up"** in the top-right corner
3. Fill out the registration form:
   - **Full Name**: Your name
   - **Email**: Your email address
   - **Password**: A secure password (8+ characters)
   - **Confirm Password**: Re-enter your password

4. Click **"Create Account"**

### Verify Your Email

1. Check your email inbox (and spam folder)
2. Click the verification link in the email from Gendox
3. You'll be redirected to confirm your email verification
4. Click **"Continue to Login"**

### First Login

1. Enter your email and password
2. Click **"Sign In"**
3. You'll see the Gendox welcome screen

## Step 2: Set Up Your Organization

Every user needs an organization to manage projects and team members.

### Create Organization

1. On the welcome screen, click **"Create Organization"**
2. Fill out the organization details:
   - **Organization Name**: Your company or personal name
   - **Description**: Brief description of your organization
   - **Website**: (Optional) Your organization's website

3. Click **"Create Organization"**

### Choose Your Plan

For this quick start, the **Free Tier** is perfect:
- 1 organization
- 2 projects  
- 10 documents per project
- 100 chat messages per month

Click **"Start with Free Tier"** to continue.

## Step 3: Create Your First Project

Projects contain your AI agents and their knowledge base.

### Create Project

1. Click **"Create New Project"** on your dashboard
2. Fill out the project details:
   - **Project Name**: e.g., "Customer Support Bot"
   - **Description**: e.g., "AI agent for answering customer questions"
   - **Project Type**: Select "Customer Support" or "General Knowledge"

3. Click **"Create Project"**

### Configure AI Settings

1. **Choose AI Model**: Select "GPT-3.5-turbo" (free tier) or "GPT-4" (paid tiers)
2. **Set Temperature**: 0.7 (balanced creativity and consistency)
3. **Max Response Length**: 500 tokens
4. **Agent Personality**: Add instructions like:
   ```
   You are a helpful customer support assistant. Be friendly, 
   professional, and provide accurate information based on the 
   provided documentation. If you don't know something, 
   say so clearly.
   ```

5. Click **"Save Configuration"**

## Step 4: Upload Your Documents

Now it's time to give your AI agent knowledge by uploading documents.

### Prepare Your Documents

For best results, use documents that are:
- **Text-based PDFs** (not scanned images)
- **Well-formatted** with clear headings and structure
- **Relevant** to your use case
- **Up-to-date** information

### Upload Documents

1. In your project, click **"Upload Documents"**
2. **Drag and drop** your files or click **"Browse Files"**
3. Select your documents (PDF, DOCX, TXT, or MD files)
4. Wait for upload to complete

### Document Processing

Gendox will automatically:
1. **Extract text** from your documents
2. **Split content** into meaningful sections
3. **Generate embeddings** for semantic search
4. **Index content** for fast retrieval

This process usually takes 1-3 minutes per document.

### Verify Processing

1. Go to **"Documents"** tab in your project
2. Check that all documents show **"Processed"** status
3. Click on a document to view its sections and content

## Step 5: Test Your AI Agent

Time to chat with your newly trained AI agent!

### Start a Conversation

1. Click **"Chat"** tab in your project
2. You'll see a chat interface with your AI agent
3. Start with a simple greeting: "Hello! What can you help me with?"

### Test Knowledge

Ask questions related to your documents:

**Examples:**
- "What is our refund policy?" (if you uploaded policy documents)
- "How do I install the software?" (if you uploaded installation guides)
- "What are the main features of this product?" (if you uploaded product documentation)

### Analyze Responses

Notice how your AI agent:
- ✅ **Provides accurate answers** based on your documents
- ✅ **Cites sources** by referencing specific document sections
- ✅ **Maintains context** throughout the conversation
- ✅ **Admits uncertainty** when information isn't in the documents

## Step 6: Customize Your Agent

Fine-tune your agent's behavior and appearance.

### Adjust AI Settings

1. Go to **"Settings"** → **"AI Configuration"**
2. **Experiment with parameters**:
   - **Temperature**: 0.1 (more consistent) to 1.0 (more creative)
   - **Max Tokens**: Adjust response length
   - **System Instructions**: Refine personality and behavior

### Update Agent Instructions

Try different instruction styles:

**Professional Support Agent:**
```
You are a professional customer support representative. 
Always be polite, concise, and solution-oriented. 
Provide step-by-step instructions when helpful.
```

**Friendly Expert:**
```
You are a knowledgeable and friendly expert. Explain 
concepts clearly and use examples. Feel free to be 
conversational while remaining informative.
```

**Technical Assistant:**
```
You are a technical documentation assistant. Provide 
precise, detailed answers with code examples when 
applicable. Be thorough but organized.
```

### Test Changes

After each change:
1. Click **"Save Configuration"**
2. Test with the same questions in **"Chat"**
3. Compare responses to see the difference

## Step 7: Share and Deploy

Your AI agent is ready! Here are ways to share it:

### Internal Testing

1. **Invite Team Members**:
   - Go to **"Organization Settings"** → **"Members"**
   - Click **"Invite User"** and enter email addresses
   - Assign roles (Admin, Editor, Viewer)

2. **Share Project Link**:
   - Copy the project URL from your browser
   - Share with team members who have accounts

### Public Deployment

1. **Website Widget**:
   ```html
   <!-- Add to your website -->
   <script src="https://app.gendox.dev/widget.js"></script>
   <script>
     GendoxWidget.init({
       projectId: 'your-project-id',
       organizationId: 'your-org-id'
     });
   </script>
   ```

2. **API Integration**:
   ```javascript
   // Example API call
   const response = await fetch('https://app.gendox.dev/api/v1/chat', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer your-api-key',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       message: 'Hello!',
       projectId: 'your-project-id'
     })
   });
   ```

## Next Steps

Congratulations! You've successfully created your first AI agent. Here's what to explore next:

### Enhance Your Agent

1. **[Add More Documents](../user-manual/document-upload)**: Expand your agent's knowledge base
2. **[Advanced Configuration](../user-manual/ai-agent-configuration)**: Fine-tune behavior and responses
3. **[Conversation Management](../user-manual/chat-interface)**: Learn about thread management and history

### Scale Your Implementation

1. **[Organization Management](../user-manual/organization-management)**: Add team members and manage permissions
2. **[Multiple Projects](../user-manual/project-settings)**: Create specialized agents for different use cases
3. **[API Integration](../api/overview)**: Build custom applications using Gendox APIs

### Advanced Features

1. **[Custom Integrations](../integrations/overview)**: Connect with external services
2. **[Analytics and Monitoring](../administration/monitoring)**: Track usage and performance
3. **[Security Settings](../security/overview)**: Configure advanced security features

## Troubleshooting

### Common Issues

**Agent gives generic responses:**
- ✅ Check that documents are processed successfully
- ✅ Ensure questions relate to uploaded content
- ✅ Try more specific questions

**Slow document processing:**
- ✅ Large files take longer to process
- ✅ Check document format (text-based PDFs work best)
- ✅ Contact support if processing takes over 30 minutes

**Chat not working:**
- ✅ Verify AI model configuration is saved
- ✅ Check that you have remaining message quota
- ✅ Try refreshing the page

### Getting Help

- **💬 Discord Community**: [discord.gg/jWes2urauW](https://discord.gg/jWes2urauW)
- **📖 Documentation**: Browse comprehensive guides
- **🎥 Video Tutorials**: Coming soon on YouTube
- **📧 Support Email**: contact@ctrlspace.dev

## Example Use Cases

Get inspired by what others have built:

### Customer Support Bot
**Documents**: FAQ, product manuals, troubleshooting guides
**Use Case**: 24/7 customer support with instant, accurate answers

### Employee Knowledge Assistant  
**Documents**: HR policies, company procedures, training materials
**Use Case**: Help employees find information quickly without bothering colleagues

### Educational Tutor
**Documents**: Textbooks, lecture notes, course materials
**Use Case**: Personalized tutoring that answers student questions anytime

### Sales Assistant
**Documents**: Product specifications, pricing guides, case studies
**Use Case**: Help sales team answer technical questions and close deals faster

### Legal Research Assistant
**Documents**: Legal documents, case studies, regulations
**Use Case**: Quick research and analysis for legal professionals

## Performance Tips

### Optimize Document Quality

1. **Use clear, well-structured documents**
2. **Include relevant metadata and headings**
3. **Keep documents focused and up-to-date**
4. **Remove duplicate or contradictory information**

### Improve Agent Responses

1. **Write specific, detailed instructions**
2. **Test with various question types**
3. **Regularly update and expand knowledge base**
4. **Monitor conversations and gather user feedback**

### Scale Effectively

1. **Organize documents into logical projects**
2. **Use consistent naming conventions**
3. **Regular content audits and updates**
4. **Monitor usage and optimize performance**

Ready to build more sophisticated AI agents? Continue exploring the [User Manual](../user-manual/registration) for advanced features! 🚀

---

**🎉 Congratulations!** You've successfully created your first intelligent AI agent with Gendox. Your agent is now ready to help users find information and answer questions based on your documents. 

What will you build next?