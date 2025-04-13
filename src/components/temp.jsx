const renderSetup = () => (
  <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-12 pl-12">
    <h1 className="text-3xl font-bold mb-6 text-center">Certification Quiz Setup</h1>
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3">Question Source</h2>
      <div className="bg-gray-50 p-4 rounded mb-4">
        <p className="mb-2">
          Current question bank: 
          <span className="font-semibold ml-2">
            {questionSource === 'default' ? 'Default' : 'Uploaded'} 
            ({questionPool.length} questions)
          </span>
        </p>
        <div className="flex items-center mt-3">
          <input
            type="file"
            accept=".json,.csv"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded mr-3"
            disabled={loadingQuestions}
          >
            {loadingQuestions ? 'Loading...' : 'Upload Question Bank'}
          </button>
          <button
            onClick={() => {
              setQuestionPool(defaultQuestionPool);
              setQuestionSource('default');
            }}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
            disabled={questionSource === 'default'}
          >
            Use Default Questions
          </button>
        </div>
        {fileUploadError && (
          <div className="mt-3 text-red-600">
            {fileUploadError}
          </div>
        )}
      </div>
    </div>
    <div className="mb-6">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Number of Questions (max: {questionPool.length})
      </label>
      <input
        type="number"
        min="1"
        max={questionPool.length}
        value={numQuestions}
        onChange={(e) => setNumQuestions(Math.min(parseInt(e.target.value) || 1, questionPool.length))}
        className="w-full p-2 border rounded"
      />
    </div>
    <div className="mb-6">
      <label className="block text-gray-700 text-sm font-bold mb-2">
        Time Limit (minutes)
      </label>
      <input
        type="number"
        min="1"
        value={timeLimit}
        onChange={(e) => setTimeLimit(parseInt(e.target.value) || 1)}
        className="w-full p-2 border rounded"
      />
    </div>
    <button
      onClick={startQuiz}
      className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
    >
      Start Quiz
    </button>
    {historyLoaded && progressHistory.length > 0 && (
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Progress History</h2>
        <div className="bg-gray-50 p-4 rounded overflow-auto max-h-60">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left py-2">Date</th>
                <th className="text-center py-2">Questions</th>
                <th className="text-center py-2">Score</th>
                <th className="text-center py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {progressHistory.slice(-10).map((entry, index) => (
                <tr key={index} className="border-t">
                  <td className="py-2">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="text-center py-2">{entry.correctAnswers}/{entry.totalQuestions}</td>
                  <td className="text-center py-2">{entry.score}%</td>
                  <td className="text-center py-2">{entry.timeUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-right">
          <button
            onClick={() => exportProgressHistoryToFile(progressHistory)}
            className="text-blue-600 hover:text-blue-800"
          >
            Export History to CSV
          </button>
        </div>
      </div>
    )}
  </div>
);