<div align="center">
  <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Real Estate Automation" width="100%" style="border-radius: 10px;" />

  <h1>?? WhatsApp Real Estate Automation Bot</h1>
  <p><strong>Intelligent Outreach • AI Conversation Scoring • Auto-Forwarding</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge&logo=node.js" alt="Node.js" />
    <img src="https://img.shields.io/badge/WhatsApp_Web.js-Enabled-25D366?style=for-the-badge&logo=whatsapp" alt="WhatsApp" />
    <img src="https://img.shields.io/badge/AI-OpenRouter-blue?style=for-the-badge&logo=openai" alt="AI Powered" />
    <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status" />
  </p>
</div>

## ? Overview

This project is a powerful WhatsApp automation tool tailored for Real Estate outreach. It fully automates the process of contacting potential buyers or sellers, nurturing conversations, and using AI to qualify leads!

### ?? Key Features

- **?? CSV Contact Loading**: Automatically load and parse your lead lists from contacts.csv.
- **?? Smart Template Messaging**: Sends personalized first messages (buyer/seller templates) with human-like delays to avoid spam detection.
- **?? Active Listening**: Monitors and logs replies from prospects in real-time.
- **?? AI Lead Scoring**: Analyzes conversations utilizing OpenRouter AI to intelligently score leads as ?? HOT, ??? WARM, or ?? COLD.
- **?? Auto-Forwarding**: Seamlessly forwards a clean, formatted summary of qualified leads (e.g., matching the HOT threshold) to your designated team WhatsApp number.

---

## ??? Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A dedicated WhatsApp account for outreach.

### Installation

1. **Clone the Repository**
   \\\ash
   git clone https://github.com/maybeswayam/Whatsapp-automation-bot.git
   cd Whatsapp-automation-bot
   \\\

2. **Configure Environment Variables**
   Copy the example config and fill in your credentials:
   \\\ash
   cp .env.example .env
   \\\
   *Make sure to provide your OpenRouter API keys and forwarding number in .env.*

3. **Prepare Your Lead List**
   Edit contacts.csv with the details of your prospects.

4. **Install Dependencies**
   \\\ash
   npm install
   \\\

5. **Start the Bot**
   \\\ash
   npm start
   \\\
6. **Authenticate**
   Open WhatsApp on your phone, go to **Linked Devices**, and scan the QR code generated in the terminal on the first run.

---

## ?? Project Structure

- ?? contacts.csv – Your outreach prospect list.
- ?? state.json – Auto-generated database persisting outreach state (sent, replied, conversation history, AI score, forwarded status).
- ?? .wwebjs_auth/ – Local WhatsApp session cache (created automatically after the first QR scan).
- ?? modules/ - Core logic for AI scoring, forwarding, listeners, scheduling, and state management.

---

## ?? Important Compliance Notice

**Ban Risk Warning:** Automated outreach may violate WhatsApp's Terms of Service and can result in phone numbers getting banned. 
- Always use conservative sending limits.
- Warm up new numbers gradually.
- Keep your messaging highly relevant and avoid spam-like patterns.
- Ensure prospects have opted-in where legally required.

---

<div align="center">
  <i>Developed with ?? for real estate professionals optimizing workflow automation.</i>
</div>
