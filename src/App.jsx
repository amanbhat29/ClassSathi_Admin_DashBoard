import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import MainLayout from './components/layout/MainLayout';
import PageHeader from './components/layout/PageHeader';
import Stepper from './components/layout/Stepper';
import Step1WhatToTest from './features/Step1WhatToTest';
import Step2PaperStructure from './features/Step2PaperStructure';
import Step3PreviewPrint from './features/Step3PreviewPrint';
import PaperSummary from './features/PaperSummary';
import { QTYPES } from './data/curriculum';
import { generateQuestionsOffline, generateSingleQuestion } from './utils/generator';
import { isStep1Complete } from './utils/helpers';
import './App.css';


export default function App() {
  const [activeStep, setActiveStep] = useState(1);
  const [grade, setGrade] = useState(null);
  const [subject, setSubject] = useState(null);
  const [selectedChapters, setSelectedChapters] = useState([]);
  
  // Structure settings matching prototype
  const [examName, setExamName] = useState("Mid-Term Examination 2026–27");
  const [maxMarks, setMaxMarks] = useState(50);
  const [duration, setDuration] = useState("1½ hours");
  const [qtypes, setQtypes] = useState(QTYPES);
  const [difficulty, setDifficulty] = useState('balanced');
  const [hots, setHots] = useState(30);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedBlooms, setSelectedBlooms] = useState([]);

  // Generation status and questions list
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  const handleStartOver = () => {
    setGrade(null);
    setSubject(null);
    setSelectedChapters([]);
    setExamName("Mid-Term Examination 2026–27");
    setMaxMarks(50);
    setDuration("1½ hours");
    setQtypes(QTYPES);
    setDifficulty('balanced');
    setHots(30);
    setSelectedSkills([]);
    setSelectedBlooms([]);
    setQuestions([]);
    setIsLoading(false);
    setActiveStep(1);
  };

  const handleStepClick = (stepNumber) => {
    const step1Done = isStep1Complete(grade, subject, selectedChapters);
    if (stepNumber === 1 || (stepNumber === 2 && step1Done)) {
      setActiveStep(stepNumber);
    }
  };


  const handlePickGrade = (newGrade) => {
    setGrade(newGrade);
    setSelectedChapters([]);
  };

  const handlePickSubject = (newSubject) => {
    setSubject(newSubject);
    setSelectedChapters([]);
  };

  const handleToggleChapter = (chapterName) => {
    setSelectedChapters((prev) =>
      prev.includes(chapterName)
        ? prev.filter((c) => c !== chapterName)
        : [...prev, chapterName]
    );
  };

  const handleSelectAllChapters = (allChapters) => {
    setSelectedChapters(allChapters);
  };

  const handleClearChapters = () => {
    setSelectedChapters([]);
  };

  const handleNextToStep2 = () => {
    setActiveStep(2);
  };

  const handleUpdateField = (field, value) => {
    if (field === 'examName') setExamName(value);
    else if (field === 'maxMarks') setMaxMarks(value);
    else if (field === 'duration') setDuration(value);
    else if (field === 'difficulty') setDifficulty(value);
    else if (field === 'hots') setHots(value);
  };

  const handleUpdateQType = (index, field, value) => {
    setQtypes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleToggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleToggleBloom = (bloom) => {
    setSelectedBlooms((prev) =>
      prev.includes(bloom)
        ? prev.filter((b) => b !== bloom)
        : [...prev, bloom]
    );
  };

  const handleBackToStep2 = () => {
    setActiveStep(2);
  };

  const executeGeneration = () => {
    setIsLoading(true);
    setTimeout(() => {
      try {
        const payload = {
          qtypes,
          hots,
          chapters: selectedChapters,
          difficulty,
          blooms: selectedBlooms,
          skills: selectedSkills
        };
        const generated = generateQuestionsOffline(payload);
        setQuestions(generated || []);
      } catch (err) {
        console.error('[App] Question generation failed:', err);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 900);
  };

  const handleGeneratePaper = () => {
    setActiveStep(3);
    executeGeneration();
  };

  const handleRegenerateAll = () => {
    executeGeneration();
  };

  const handleRedoQuestion = (globalIndex) => {
    if (globalIndex < 0 || globalIndex >= questions.length) return;
    try {
      const oldQuestion = questions[globalIndex];
      if (!oldQuestion) return;
      const newQuestion = generateSingleQuestion(
        oldQuestion.type,
        oldQuestion.hots,
        oldQuestion.chapter,
        difficulty,
        selectedBlooms,
        selectedSkills,
        oldQuestion.marks
      );

      setQuestions((prev) => {
        const copy = [...prev];
        copy[globalIndex] = newQuestion;
        return copy;
      });
    } catch (err) {
      console.error('[App] Failed to redo question:', err);
    }
  };

  return (
    <MainLayout sidebar={<Sidebar />}>
      <PageHeader onStartOver={handleStartOver} />
      
      <Stepper activeStep={activeStep} onStepClick={handleStepClick} />
      
      <div className="layout">
        <div className="workspace-column">
          {activeStep === 1 && (
            <Step1WhatToTest
              grade={grade}
              subject={subject}
              selectedChapters={selectedChapters}
              onPickGrade={handlePickGrade}
              onPickSubject={handlePickSubject}
              onToggleChapter={handleToggleChapter}
              onSelectAllChapters={handleSelectAllChapters}
              onClearChapters={handleClearChapters}
              onNext={handleNextToStep2}
            />
          )}
          
          {activeStep === 2 && (
            <Step2PaperStructure
              examName={examName}
              maxMarks={maxMarks}
              duration={duration}
              qtypes={qtypes}
              difficulty={difficulty}
              hots={hots}
              selectedSkills={selectedSkills}
              selectedBlooms={selectedBlooms}
              onUpdateField={handleUpdateField}
              onUpdateQType={handleUpdateQType}
              onToggleSkill={handleToggleSkill}
              onToggleBloom={handleToggleBloom}
              onBack={handleStepClick.bind(null, 1)}
              onGenerate={handleGeneratePaper}
            />
          )}

          {activeStep === 3 && (
            <Step3PreviewPrint
              isLoading={isLoading}
              examName={examName}
              duration={duration}
              subject={subject}
              grade={grade}
              selectedChapters={selectedChapters}
              qtypes={qtypes}
              questions={questions}
              onBack={handleBackToStep2}
              onRegenerateAll={handleRegenerateAll}
              onRedoQuestion={handleRedoQuestion}
            />
          )}
        </div>
        
        <div className="summary-column">
          <PaperSummary
            grade={grade}
            subject={subject}
            selectedChapters={selectedChapters}
            qtypes={qtypes}
            difficulty={difficulty}
            hots={hots}
            maxMarks={maxMarks}
          />
        </div>
      </div>
    </MainLayout>
  );
}
