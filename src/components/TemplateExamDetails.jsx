/**
 * TemplateExamDetails.jsx
 *
 * Renders the exam details block (Exam name/year banner and the Class/Subject/Time/Marks grid table).
 * Supports inline editing when editable.
 */

import EditableField from './EditableField';

export default function TemplateExamDetails({
  examName,
  academicYear,
  grade,
  subject,
  duration,
  totalMarks,
  onFieldChange,
  isEditable = true,
  themeColors
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '8px', width: '100%' }}>
      {/* Exam Title Card Banner */}
      <div style={{ margin: '8px 0', textAlign: 'center' }}>
        <h3 style={{ margin: 0, padding: 0, display: 'inline-block', textAlign: 'center', width: '100%' }}>
          <EditableField
            value={examName}
            onChange={(val) => onFieldChange('examName', val)}
            placeholder="EXAMINATION NAME"
            isEditable={isEditable}
            style={{
              fontSize: '16px',
              fontWeight: '800',
              color: themeColors.primary,
              textTransform: 'uppercase',
              textAlign: 'center',
              display: 'inline'
            }}
          />
          <span style={{ fontSize: '16px', fontWeight: '800', color: themeColors.primary, margin: '0 4px' }}> </span>
          <EditableField
            value={academicYear}
            onChange={(val) => onFieldChange('academicYear', val)}
            placeholder="Academic Year"
            isEditable={isEditable}
            style={{
              fontSize: '16px',
              fontWeight: '800',
              color: themeColors.primary,
              textAlign: 'center',
              display: 'inline'
            }}
          />
        </h3>
      </div>

      {/* Metadata Table Grid (2x2) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0' }}>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #d0cfd5', padding: '6px 12px', width: '50%', fontSize: '13px', textAlign: 'left' }}>
              <strong>Class: </strong>
              <EditableField
                value={grade}
                onChange={(val) => onFieldChange('grade', val)}
                placeholder="Grade / Class"
                isEditable={isEditable}
                style={{ display: 'inline' }}
              />
            </td>
            <td style={{ border: '1px solid #d0cfd5', padding: '6px 12px', width: '50%', fontSize: '13px', textAlign: 'left' }}>
              <strong>Subject: </strong>
              <EditableField
                value={subject}
                onChange={(val) => onFieldChange('subject', val)}
                placeholder="Subject"
                isEditable={isEditable}
                style={{ display: 'inline' }}
              />
            </td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #d0cfd5', padding: '6px 12px', width: '50%', fontSize: '13px', textAlign: 'left' }}>
              <strong>Time Allowed: </strong>
              <EditableField
                value={duration}
                onChange={(val) => onFieldChange('duration', val)}
                placeholder="Time Allowed"
                isEditable={isEditable}
                style={{ display: 'inline' }}
              />
            </td>
            <td style={{ border: '1px solid #d0cfd5', padding: '6px 12px', width: '50%', fontSize: '13px', textAlign: 'left' }}>
              <strong>Maximum Marks: </strong>
              <EditableField
                value={totalMarks}
                onChange={(val) => onFieldChange('totalMarks', val)}
                placeholder="Max Marks"
                isEditable={isEditable}
                style={{ display: 'inline' }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
