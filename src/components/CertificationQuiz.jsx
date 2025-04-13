// CertificationQuiz.jsx
import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';

const CertificationQuiz = () => {
  // Default question pool - moved to the top
  const defaultQuestionPool = [
    {
      id: 1,
      question: "Which of the following is NOT a valid variable name in JavaScript?",
      options: ["myVar", "123var", "_variable", "$price"],
      correctAnswer: "123var",
      explanation: "Variable names in JavaScript cannot start with a number. They must begin with a letter, underscore (_), or dollar sign ($)."
    },
    {
      id: 2,
      question: "What is the time complexity of searching for an element in a balanced binary search tree?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correctAnswer: "O(log n)",
      explanation: "In a balanced binary search tree, each comparison eliminates roughly half of the remaining elements, resulting in a logarithmic time complexity."
    },
    // More default questions...
  ];

  // State variables
  const [step, setStep] = useState('setup'); // setup, quiz, results
  const [numQuestions, setNumQuestions] = useState(defaultQuestionPool.length > 0 ? Math.min(defaultQuestionPool.length, 10) : 10);
  const [timeLimit, setTimeLimit] = useState(15); // minutes
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [questionPool, setQuestionPool] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionSource, setQuestionSource] = useState('default');
  const [fileUploadError, setFileUploadError] = useState('');
  const [progressHistory, setProgressHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);
  
  // Load question pool on component mount
  useEffect(() => {
    setQuestionPool(defaultQuestionPool);
    loadProgressHistory();
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Load progress history from localStorage
  const loadProgressHistory = () => {
    try {
      const savedHistory = localStorage.getItem('quizProgressHistory');
      if (savedHistory) {
        setProgressHistory(JSON.parse(savedHistory));
      }
      setHistoryLoaded(true);
    } catch (error) {
      console.error("Error loading progress history:", error);
      setHistoryLoaded(true);
    }
  };

  // Save progress history to localStorage
  const saveProgressHistory = (newHistoryEntry) => {
    try {
      const updatedHistory = [...progressHistory, newHistoryEntry];
      setProgressHistory(updatedHistory);
      localStorage.setItem('quizProgressHistory', JSON.stringify(updatedHistory));
      
      // Optional: Export to CSV
      exportProgressHistoryToFile(updatedHistory);
    } catch (error) {
      console.error("Error saving progress history:", error);
    }
  };

  // Export progress history to CSV file
  const exportProgressHistoryToFile = (history) => {
    try {
      // Create CSV content
      const header = "Date,Questions,Correct,Score,TimeUsed\n";
      const rows = history.map(entry => {
        return `${entry.date},${entry.totalQuestions},${entry.correctAnswers},${entry.score}%,${entry.timeUsed}`;
      }).join('\n');
      
      const csvContent = header + rows;
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create hidden download link and trigger click
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "quiz_history.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting progress history:", error);
    }
  };

  // Handle question file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFileUploadError('');
    
    if (!file) return;
    
    setLoadingQuestions(true);
    console.log('File selected:', file.name, file.type);
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    console.log('File extension detected:', fileExtension);
    
    if (fileExtension === 'json') {
      // Handle JSON file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          console.log('JSON file content:', e.target.result.substring(0, 100) + '...');
          // Clean the content by removing any non-JSON text at the beginning
          const content = e.target.result.replace(/^[\s\S]*?(\[[\s\S]*)/m, '$1');
          const questionsData = JSON.parse(content);
          console.log('Parsed JSON data:', questionsData.length, 'questions');
          validateAndSetQuestions(questionsData);
        } catch (error) {
          console.error('JSON parsing error:', error);
          setFileUploadError('Invalid JSON format. Please check your file.');
          setLoadingQuestions(false);
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        setFileUploadError('Error reading file.');
        setLoadingQuestions(false);
      };
      reader.readAsText(file);
    } else if (fileExtension === 'csv') {
      // Handle CSV file - no changes needed here
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            console.log('CSV parsing complete:', results.data.length, 'rows');
            const processedData = results.data.map((row, index) => {
              return {
                id: index + 1,
                question: row.question,
                options: [
                  row.option1 || row.options1 || '',
                  row.option2 || row.options2 || '',
                  row.option3 || row.options3 || '',
                  row.option4 || row.options4 || ''
                ].filter(option => option !== ''),
                correctAnswer: row.correctAnswer || row.correct || '',
                explanation: row.explanation || ''
              };
            });
            validateAndSetQuestions(processedData);
          } catch (error) {
            console.error('CSV processing error:', error);
            setFileUploadError('Error processing CSV data. Please check your file format.');
            setLoadingQuestions(false);
          }
        },
        error: (error) => {
          console.error('Papa Parse error:', error);
          setFileUploadError('Error parsing CSV: ' + error.message);
          setLoadingQuestions(false);
        }
      });
    } else {
      console.error('Unsupported file type:', fileExtension);
      setFileUploadError('Unsupported file type. Please upload JSON or CSV.');
      setLoadingQuestions(false);
    }
  };

  // Validate and set questions from uploaded file
  const validateAndSetQuestions = (questions) => {
    console.log('Validating questions:', questions);
    
    // Basic validation
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('Invalid question format: not an array or empty array');
      setFileUploadError('Invalid question format. Please check your file.');
      setLoadingQuestions(false);
      return;
    }
    
    // More detailed validation
    const invalidQuestions = questions.filter(q => {
      const isInvalid = !q.question || 
        !Array.isArray(q.options) || 
        q.options.length < 2 || 
        !q.correctAnswer ||
        !q.options.includes(q.correctAnswer);
      
      if (isInvalid) {
        console.error('Invalid question:', q);
      }
      
      return isInvalid;
    });
    
    if (invalidQuestions.length > 0) {
      console.error(`Found ${invalidQuestions.length} invalid questions`);
      setFileUploadError(`Found ${invalidQuestions.length} invalid questions. Please check your file format.`);
      setLoadingQuestions(false);
      return;
    }
    
    // All good, set the questions
    console.log('Setting question pool with', questions.length, 'valid questions');
    setQuestionPool(questions);
    setQuestionSource('uploaded');
    setLoadingQuestions(false);
  };

  // Start the quiz
  const startQuiz = () => {
    if (numQuestions > questionPool.length) {
      alert(`The maximum number of questions available is ${questionPool.length}. Please enter a smaller number.`);
      return;
    }

    // Randomly select questions from the pool
    const shuffled = [...questionPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numQuestions);
    
    // Initialize answers array with null values
    const initialAnswers = new Array(selected.length).fill(null);
    
    setSelectedQuestions(selected);
    setAnswers(initialAnswers);
    setTimeRemaining(timeLimit * 60); // Convert minutes to seconds
    setQuizStarted(true);
    setStep('quiz');
  };

  // Handle answer selection
  const selectAnswer = (answerIndex) => {
    console.log("Selecting answer:", answerIndex);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    console.log("New answers array:", newAnswers);
    setAnswers(newAnswers);
  };

  // Navigate to next question
  const nextQuestion = () => {
    if (currentQuestion < selectedQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  // Navigate to previous question
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Finish the quiz
  const finishQuiz = () => {
    setQuizFinished(true);
    clearInterval(timerRef.current);
    setStep('results');
    
    // Save results to progress history
    const timeUsed = (timeLimit * 60) - timeRemaining;
    const results = calculateResults();
    const historyEntry = {
      date: new Date().toISOString(),
      totalQuestions: results.totalQuestions,
      correctAnswers: results.correctAnswers,
      score: results.score,
      timeUsed: formatTime(timeUsed)
    };
    
    saveProgressHistory(historyEntry);
  };

  // Calculate quiz results
  const calculateResults = () => {
    let correct = 0;
    
    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      const userAnswer = answers[i] !== null ? question.options[answers[i]] : null;
      
      if (userAnswer === question.correctAnswer) {
        correct++;
      }
    }
    
    return {
      totalQuestions: selectedQuestions.length,
      correctAnswers: correct,
      score: Math.round((correct / selectedQuestions.length) * 100)
    };
  };

  // Reset the quiz to try again
  const resetQuiz = () => {
    setStep('setup');
    setCurrentQuestion(0);
    setSelectedQuestions([]);
    setAnswers([]);
    setTimeRemaining(0);
    setQuizStarted(false);
    setQuizFinished(false);
  };

  // Timer effect
  useEffect(() => {
    if (quizStarted && !quizFinished) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizStarted, quizFinished]);

  // Add this function to clear the progress history
  const clearProgressHistory = () => {
    try {
      setProgressHistory([]);
      localStorage.removeItem('quizProgressHistory');
    } catch (error) {
      console.error("Error clearing progress history:", error);
    }
  };

  // Add this function to download sample JSON
  const downloadSampleJSON = () => {
    const sampleQuestions = [
      {
        "id": 1,
        "question": "What is the primary function of DNS?",
        "options": [
          "To assign IP addresses to new devices",
          "To translate domain names to IP addresses",
          "To encrypt network traffic",
          "To manage database connections"
        ],
        "correctAnswer": "To translate domain names to IP addresses",
        "explanation": "The Domain Name System (DNS) translates human-readable domain names to IP addresses."
      },
      {
        "id": 2,
        "question": "Which encryption algorithm is considered asymmetric?",
        "options": ["AES", "DES", "RSA", "Blowfish"],
        "correctAnswer": "RSA",
        "explanation": "RSA is an asymmetric encryption algorithm that uses a pair of keys."
      }
    ];
    
    const blob = new Blob([JSON.stringify(sampleQuestions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-questions.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render the setup screen
  const renderSetup = () => (
    <div className="w-full max-w-[600px] mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Quiz Setup</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Question Source</h2>
        <div className="bg-gray-50 p-4 rounded mb-4">
          <p className="mb-2">
            Current question bank : 
            <span className="font-semibold ml-2">
              {questionSource === 'default' ? 'Default' : 'Custom'} 
              ({questionPool.length} questions)
            </span>
          </p>
          
          <div className="mt-3">
            <div className="flex flex-col space-y-4">
              {/* Default Questions Option */}
              <div>
                <button
                  onClick={() => {
                    setQuestionPool(defaultQuestionPool);
                    setQuestionSource('default');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    width: '100%',
                    textAlign: 'left',
                    backgroundColor: questionSource === 'default' ? '#3b82f6' : '#e5e7eb',
                    color: questionSource === 'default' ? 'white' : 'black',
                    border: questionSource === 'default' ? '2px solid #2563eb' : '1px solid #d1d5db',
                  }}
                >
                  1. Default Questions
                </button>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280', 
                  marginTop: '2px', 
                  marginLeft: '8px' 
                }}>
                  Use our pre-defined question set for practice
                </p>
              </div>
              
              {/* Custom Questions Option */}
              <div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (fileInputRef && fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    width: '100%',
                    textAlign: 'left',
                    backgroundColor: questionSource === 'uploaded' ? '#3b82f6' : '#e5e7eb',
                    color: questionSource === 'uploaded' ? 'white' : 'black',
                    border: questionSource === 'uploaded' ? '2px solid #2563eb' : '1px solid #d1d5db',
                    cursor: loadingQuestions ? 'not-allowed' : 'pointer',
                    opacity: loadingQuestions ? 0.7 : 1,
                  }}
                  disabled={loadingQuestions}
                >
                  2. Custom Questions
                </button>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '2px',
                  marginLeft: '8px'
                }}>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280',
                    marginRight: '8px'
                  }}>
                    Upload your own question file (JSON or CSV)
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      downloadSampleJSON();
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Download sample
                  </button>
                </div>
              </div>
              
              <input
                type="file"
                accept=".json,.csv"
                onChange={(e) => {
                  handleFileUpload(e);
                  // Reset the input value to allow selecting the same file again
                  e.target.value = '';
                }}
                ref={fileInputRef}
                className="hidden"
                id="fileInput"
              />
            </div>
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
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '0.25rem',
          width: '100%',
          textAlign: 'center',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: '2px solid #2563eb',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem',
          marginTop: '1rem'
        }}
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
          <div className="mt-2 flex justify-between">
            <button
              onClick={clearProgressHistory}
              className="text-red-600 hover:text-red-800"
            >
              Clear History
            </button>
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

  // Render the quiz screen
  const renderQuiz = () => {
    const currentQ = selectedQuestions[currentQuestion];
    const userAnswer = answers[currentQuestion];
    
    console.log("Current question:", currentQuestion);
    console.log("User answer:", userAnswer);
    console.log("Answers array:", answers);
    
    return (
      <div className="w-full max-w-[600px] mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-bold">
            Question {currentQuestion + 1} of {selectedQuestions.length}
          </div>
          <div className="text-xl font-mono bg-blue-100 p-2 rounded">
            Time: {formatTime(timeRemaining)}
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-center">{currentQ.question}</h2>
          
          <div className="space-y-3">
            {currentQ.options.map((option, index) => {
              const isSelected = userAnswer === index;
              return (
                <div 
                  key={index}
                  onClick={() => selectAnswer(index)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#3b82f6' : 'white',
                    color: isSelected ? 'white' : 'black',
                    marginBottom: '0.75rem'
                  }}
                >
                  {option}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className={`px-4 py-2 rounded ${
              currentQuestion === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Previous
          </button>
          
          {currentQuestion === selectedQuestions.length - 1 ? (
            <button
              onClick={finishQuiz}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Finish Quiz
            </button>
          ) : (
            <>
              <button
                onClick={finishQuiz}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                End Early
              </button>
              
              <button
                onClick={nextQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render the results screen
  const renderResults = () => {
    const results = calculateResults();
    const timeUsed = (timeLimit * 60) - timeRemaining;
    
    return (
      <div className="w-full max-w-[600px] mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-6">Quiz Results</h1>
        
        <div className="mb-6 bg-blue-100 p-4 rounded">
          <div className="text-xl font-bold mb-2">
            Score: {results.correctAnswers} out of {results.totalQuestions} ({results.score}%)
          </div>
          <div className="text-lg">
            Time used: {formatTime(timeUsed)} of {formatTime(timeLimit * 60)}
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Question Review</h2>
          
          {selectedQuestions.map((question, index) => {
            const userAnswer = answers[index] !== null ? question.options[answers[index]] : "Not answered";
            const isCorrect = userAnswer === question.correctAnswer;
            
            return (
              <div key={index} className="mb-12 p-4 border-2 rounded text-left" style={{
                borderColor: isCorrect ? '#22c55e' : '#ef4444',
                backgroundColor: isCorrect ? '#f0fdf4' : '#fef2f2',
                marginBottom: '3rem'
              }}>
                <div className="mb-2">
                  <strong className="text-black text-lg">Question {index + 1}:</strong> {question.question}
                </div>
                <div className="mt-2 text-left">
                  <strong className="text-black">Your answer: </strong>
                  <span className={isCorrect ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                    {userAnswer} {isCorrect ? 
                      <span style={{color: "green", fontSize: "1.25rem", fontWeight: "bold"}}>✓</span> : 
                      <span style={{color: "red", fontSize: "1.25rem", fontWeight: "bold"}}>✗</span>}
                  </span>
                </div>
                <div className="mt-1 text-left">
                  <strong className="text-black">Correct answer: </strong>
                  <span className="text-green-600 font-bold">{question.correctAnswer}</span>
                </div>
                {question.explanation && (
                  <div className="mt-3 p-3 rounded" style={{
                    backgroundColor: "#fefce8"
                  }}>
                    <strong className="text-black">Explanation: </strong>{question.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div>
          <button
            onClick={resetQuiz}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Take Another Quiz
          </button>
        </div>
      </div>
    );
  };

  // Render the appropriate screen based on the current step
  return (
    <div className="w-full max-w-[600px] mx-auto">
      {step === 'setup' && renderSetup()}
      {step === 'quiz' && renderQuiz()}
      {step === 'results' && renderResults()}
    </div>
  );
};

export default CertificationQuiz;
