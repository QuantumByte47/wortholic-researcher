# 🔎 Wortholic Researcher

**Wortholic Researcher is an AI-powered research assistant designed for comprehensive web and local research on any given task.**

The agent produces detailed, factual, and unbiased research reports with citations and supports customization options for domain-specific research needs.

## Features

- Generate detailed research reports using web and local documents
- Smart image scraping and filtering for reports  
- Generate reports exceeding 2,000 words
- Aggregate multiple sources for objective conclusions
- Frontend available in HTML/CSS/JS and NextJS versions
- JavaScript-enabled web scraping
- Export reports to PDF, Word, and other formats
- Multi-agent system with specialized skills
- Deep research capabilities with recursive exploration

## Installation

1. Install Python 3.11 or later
2. Clone the project and navigate to the directory:

    ```bash
    git clone https://github.com/QuantumByte47/wortholic-researcher.git
    cd wortholic-researcher
    ```

3. Set up API keys in a `.env` file:

    ```bash
    OPENAI_API_KEY=your_openai_api_key_here
    TAVILY_API_KEY=your_tavily_api_key_here
    ```

4. Install dependencies and start the server:

    ```bash
    pip install -r requirements.txt
    python -m uvicorn main:app --reload
    ```

Visit `http://localhost:8000` to start.

## Docker Setup

```bash
docker-compose up --build
```

This will start:
- Python server on localhost:8000
- React app on localhost:3000

## Usage Example

```python
from wortholic_researcher import WortholicResearcher

query = "Why is Nvidia stock going up?"
researcher = WortholicResearcher(query=query)
research_result = await researcher.conduct_research()
report = await researcher.write_report()
```

## Local Documents Research

Set the `DOC_PATH` environment variable pointing to your documents folder:

```bash
export DOC_PATH="./my-docs"
```

Supported formats: PDF, TXT, CSV, Excel, Markdown, PowerPoint, Word

## Architecture

The system uses planner and execution agents:
- Planner generates research questions
- Execution agents gather relevant information  
- Publisher aggregates findings into comprehensive reports

## License

Apache 2.0 License