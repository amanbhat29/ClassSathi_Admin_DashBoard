/**
 * NextStepCard Component
 * Informs the user of the subsequent workflow action.
 */
export default function NextStepCard() {
  return (
    <div className="next-step-card">
      <div className="next-step-title">Next Step</div>
      <div className="next-step-headline">Generate Question Paper</div>
      <div className="next-step-desc">
        The uploaded template is ready. Configure your paper parameters (grade, subjects, structure) and click <b>Generate Paper</b>. 
        Generated questions will automatically replace the placeholder inside your uploaded Word template.
      </div>
    </div>
  );
}
