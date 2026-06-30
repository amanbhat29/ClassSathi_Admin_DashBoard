/**
 * WordTemplateEditor.jsx
 *
 * Renders the structured template editor canvas (A4 pages).
 * Allows inline editing of school info, exam details, and instructions,
 * while keeping layout, margins, and question formats locked.
 */

import TemplateRenderer from './TemplateRenderer';
import ThemeSelector from './ThemeSelector';
import '../styles/word-editor.css';

export default function WordTemplateEditor({ template, onFieldChange }) {
  if (!template) {
    return (
      <div 
        className="word-editor-container" 
        style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-mute)' }}
      >
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="word-editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Banner Toolbar holding Theme Selector */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'white',
          borderBottom: '1px solid var(--border)',
          borderRadius: '12px 12px 0 0'
        }}
      >
        <ThemeSelector
          activeTheme={template.themeColor}
          onChange={(color) => onFieldChange('themeColor', color)}
        />
        <div style={{ fontSize: '11px', color: 'var(--ink-mute)', fontWeight: 'bold' }}>
          📄 Structured Template Editor (Inline editing active)
        </div>
      </div>

      {/* Scrollable A4 Workspace Canvas */}
      <div className="word-editor-scroll" style={{ flex: 1, overflowY: 'auto', background: '#e8e7ed', padding: '0 24px 24px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <TemplateRenderer
            template={template}
            questions={[]} // loads dummy questions automatically
            qtypes={[]}    // loads dummy sections automatically
            examName={template.examName}
            grade={template.grade}
            subject={template.subject}
            duration={template.duration}
            totalMarks={template.totalMarks}
            isEditable={true}
            onFieldChange={onFieldChange}
            onExamFieldChange={(field, val) => onFieldChange(field, val)}
          />
        </div>
      </div>
    </div>
  );
}
