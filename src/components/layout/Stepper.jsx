import './Stepper.css';

export default function Stepper({ activeStep = 1, onStepClick }) {
  const steps = [
    { number: 1, label: 'What to test' },
    { number: 2, label: 'Paper structure' },
    { number: 3, label: 'Preview & print' }
  ];

  return (
    <div className="stepper" id="stepper">
      {steps.map((step) => {
        const isCurrent = activeStep === step.number;
        const isDone = activeStep > step.number;
        let pillClass = "step-pill";
        
        if (isCurrent) {
          pillClass += " current";
        } else if (isDone) {
          pillClass += " done";
        }

        return (
          <div 
            key={step.number}
            className={pillClass} 
            data-step={step.number}
            onClick={() => onStepClick && onStepClick(step.number)}
            style={{ cursor: onStepClick ? 'pointer' : 'default' }}
          >
            <span className="dot">{step.number}</span> {step.label}
          </div>
        );
      })}
    </div>
  );
}
