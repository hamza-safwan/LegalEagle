class ChatModel:
    def __init__(self, provider: str, model_name: str, api_key: str | None = None):
        self.provider = (provider or "openai").lower()
        self.model_name = model_name
        self.api_key = api_key

    def initialize_chat_model(self):
        """Initializes the chat model with the selected provider."""
        if self.provider == "openai":
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                model_name=self.model_name,
                temperature=0.0,
                api_key=self.api_key,
            )

        if self.provider == "gemini":
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
            except ImportError:
                raise RuntimeError(
                    "Gemini provider selected but 'langchain-google-genai' is not installed."
                )

            return ChatGoogleGenerativeAI(
                model=self.model_name,
                temperature=0.0,
                api_key=self.api_key,
            )

        if self.provider == "claude":
            try:
                from langchain_anthropic import ChatAnthropic
            except ImportError:
                raise RuntimeError(
                    "Claude provider selected but 'langchain-anthropic' is not installed."
                )

            return ChatAnthropic(
                model=self.model_name,
                temperature=0.0,
                api_key=self.api_key,
            )

        if self.provider == "groq":
            try:
                from langchain_groq import ChatGroq
            except ImportError:
                raise RuntimeError(
                    "Groq provider selected but 'langchain-groq' is not installed."
                )

            return ChatGroq(
                model=self.model_name,
                temperature=0.0,
                api_key=self.api_key,
            )

        raise ValueError(f"Unsupported LLM provider: {self.provider}")
