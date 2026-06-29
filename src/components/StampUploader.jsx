import BaseImageUploader from './BaseImageUploader';

export default function StampUploader({ value, onChange }) {
  return (
    <BaseImageUploader
      label="School Stamp / Seal"
      value={value}
      onChange={onChange}
    />
  );
}
