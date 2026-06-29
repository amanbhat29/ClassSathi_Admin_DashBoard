import BaseImageUploader from './BaseImageUploader';

export default function HeaderUploader({ value, onChange }) {
  return (
    <BaseImageUploader
      label="Custom Header Image (A4 Width)"
      value={value}
      onChange={onChange}
    />
  );
}
