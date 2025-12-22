import React from 'react';

const MarkdownReport = ({ content }) => {
    if (!content) return null;

    // Fonction pour parser le markdown basique
    const parseMarkdown = (text) => {
        const lines = text.split('\n');
        const elements = [];
        let currentList = null;

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // Titre H1
            if (trimmed.startsWith('# ')) {
                if (currentList) {
                    elements.push(currentList);
                    currentList = null;
                }
                elements.push(
                    <h1 key={index} className="text-3xl font-bold mb-6 mt-8 first:mt-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent pb-2 border-b-2 border-purple-500/30">
                        {parseInline(trimmed.substring(2))}
                    </h1>
                );
            }
            // Titre H2
            else if (trimmed.startsWith('## ')) {
                if (currentList) {
                    elements.push(currentList);
                    currentList = null;
                }
                elements.push(
                    <h2 key={index} className="text-2xl font-semibold mb-4 mt-6 text-n-1 border-l-4 border-purple-500 pl-4 py-2 bg-purple-500/5 rounded-r">
                        {parseInline(trimmed.substring(3))}
                    </h2>
                );
            }
            // Titre H3
            else if (trimmed.startsWith('### ')) {
                if (currentList) {
                    elements.push(currentList);
                    currentList = null;
                }
                elements.push(
                    <h3 key={index} className="text-xl font-semibold mb-3 mt-5 text-n-1 text-purple-300">
                        {parseInline(trimmed.substring(4))}
                    </h3>
                );
            }
            // Liste à puces
            else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const listItem = trimmed.substring(2);
                if (!currentList) {
                    currentList = { type: 'ul', items: [] };
                }
                currentList.items.push(
                    <li key={currentList.items.length} className="mb-3 text-n-2 leading-relaxed pl-2 marker:text-purple-400">
                        {parseInline(listItem)}
                    </li>
                );
            }
            // Paragraphe vide
            else if (trimmed === '') {
                if (currentList) {
                    elements.push(currentList);
                    currentList = null;
                }
                elements.push(<br key={`br-${index}`} />);
            }
            // Paragraphe normal
            else {
                if (currentList) {
                    elements.push(currentList);
                    currentList = null;
                }
                elements.push(
                    <p key={index} className="mb-4 text-n-2 leading-relaxed">
                        {parseInline(trimmed)}
                    </p>
                );
            }
        });

        // Ajouter la dernière liste si elle existe
        if (currentList) {
            elements.push(currentList);
        }

        return elements.map((el, idx) => {
            if (el && typeof el === 'object' && el.type === 'ul') {
                return (
                    <ul key={`ul-${idx}`} className="list-disc list-inside mb-4 ml-4 space-y-2 text-n-2">
                        {el.items}
                    </ul>
                );
            }
            return React.cloneElement(el, { key: el.key || idx });
        });
    };

    // Fonction pour parser les éléments inline (gras, etc.)
    const parseInline = (text) => {
        if (!text) return text;
        
        const parts = [];
        let currentIndex = 0;
        const regex = /\*\*(.*?)\*\*/g;
        let match;
        let keyCounter = 0;

        while ((match = regex.exec(text)) !== null) {
            // Ajouter le texte avant le match
            if (match.index > currentIndex) {
                const beforeText = text.substring(currentIndex, match.index);
                if (beforeText) {
                    parts.push(<span key={`text-${keyCounter++}`}>{beforeText}</span>);
                }
            }
            // Ajouter le texte en gras
            parts.push(
                <strong key={`bold-${keyCounter++}`} className="font-bold text-n-1 bg-purple-500/10 px-1 rounded">
                    {match[1]}
                </strong>
            );
            currentIndex = match.index + match[0].length;
        }

        // Ajouter le reste du texte
        if (currentIndex < text.length) {
            const remainingText = text.substring(currentIndex);
            if (remainingText) {
                parts.push(<span key={`text-${keyCounter++}`}>{remainingText}</span>);
            }
        }

        return parts.length > 0 ? parts : text;
    };

    return (
        <div className="markdown-report">
            {parseMarkdown(content)}
        </div>
    );
};

export default MarkdownReport;

