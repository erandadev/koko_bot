# KOKO Payment Scraper

A Node.js web scraping tool that automates the extraction of transaction data from the KOKO online payment platform and record them in a Google sheet for easy reconciliation.

## Overview

This tool helps businesses streamline their payment reconciliation process by automatically logging into the KOKO payment portal, scraping all transaction records, and put them to your Google Sheet. Say goodbye to manual data entry and hello to automated financial tracking.

## Features

- **Automated Login**: Securely logs into your KOKO payment portal using Puppeteer
- **Stealth Scraping**: Uses puppeteer-extra with stealth plugin to avoid detection
- **Transaction Extraction**: Retrieves all transaction records including:
  - Date
  - KOKO ID
  - Order ID
  - Initial Amount
  - After Discount Amount
  - Customer Name
  - Customer Phone
  - User
- **Automated Data Submission**: Posts scraped data to your custom endpoint
- **Easy Reconciliation**: Structured data format makes it simple to match payments with orders

## 📋 Prerequisites

Before you begin, ensure you have the following:

- Node.js 16.x or higher
- npm or yarn package manager
- A KOKO payment platform account
- A data submission endpoint to receive the scraped transactions (Google Script)

## 🚀 Installation

1. Clone the repository:

```bash
git clone https://github.com/erandadev/koko_bot.git
```

2. Install dependencies:

```bash
npm install
```

## ⚙️ Configuration

Create a `.env` file in the project root:

```env
KOKO_USERNAME=your_koko_username
KOKO_PASSWORD=your_koko_password
DATA_SUBMIT_ENDPOINT=https://your-api.com/endpoint
```

## 📖 Usage

### Basic Usage

Run the scraper:

```bash
npm start
```

Or run directly with Node:

```bash
node scrape.js
```

## Data Structure

The scraper extracts and submits transactions with the following fields:

| Field          | Description                          |
| -------------- | ------------------------------------ |
| DATE           | Transaction date                     |
| KOKO_ID        | Unique KOKO transaction identifier   |
| ORDER_ID       | Associated order ID                  |
| INITIAL_AMOUNT | Original transaction amount          |
| AFTER_DISCOUNT | Final amount after discounts applied |
| CUSTOMER_NAME  | Name of the customer                 |
| CUSTOMER_PHONE | Customer contact number              |
| USER           | User who processed the transaction   |

## Contributing

Contributions are welcome!

**Star this repository if you find it helpful!**
