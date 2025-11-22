from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda


class ConversationChain:
    def create_retrieval_qa_chain(self, chat_model, retriever):
        """
        Creates a lightweight retrieval QA chain.

        This avoids version-specific helpers like `create_retrieval_chain`
        and instead wires retrieval + prompting manually, returning a
        Runnable-compatible object that yields both the answer and the
        underlying context documents.
        """

        system_prompt = """You are a legal expert and contract analyzer.
Use the following context to answer the user's question thoroughly and accurately.

If you cannot find the answer in the context, say "I don't know based on the provided document."

Context:
{context}"""

        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                ("human", "{input}"),
            ]
        )

        def _invoke(inputs: dict):
            question = (inputs.get("input") or "").strip()
            if not question:
                return {"answer": "", "context": []}

            # Retrieve relevant chunks
            docs = retriever.get_relevant_documents(question) if retriever else []
            context_text = "\n\n".join(d.page_content for d in docs if getattr(d, "page_content", None))

            # Build messages via the prompt template
            messages = prompt.format_messages(context=context_text, input=question)

            # Call the underlying chat model
            result = chat_model.invoke(messages)
            answer = getattr(result, "content", None) or str(result)

            return {"answer": answer, "context": docs}

        return RunnableLambda(_invoke)
