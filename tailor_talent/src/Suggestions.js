export const Suggestions = ({suggestions, handleSuggestionAction}) => {
    return suggestions && suggestions.length > 0 && (
        <div className="suggestions-container">
          <h2>Suggestions:</h2>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-item">
              <h3 className="suggestion-title">{suggestion.title}</h3>
              <div className="suggestion-content">
                <div className="suggestion-before">
                  <div className="suggestion-label">Before:</div>
                  <div className="suggestion-text">{suggestion.before}</div>
                </div>
                <div className="suggestion-after">
                  <div className="suggestion-label">After:</div>
                  <div className="suggestion-text">{suggestion.after}</div>
                </div>
              </div>
              <div className="suggestion-reasoning">
                <div className="suggestion-label">Reasoning:</div>
                <div className="suggestion-text">{suggestion.reasoning}</div>
              </div>
              <div className="suggestion-actions">
                <button onClick={() => handleSuggestionAction(index, true)}>Accept</button>
                <button onClick={() => handleSuggestionAction(index, false)}>Deny</button>
              </div>
        </div>))}
      </div>)
}