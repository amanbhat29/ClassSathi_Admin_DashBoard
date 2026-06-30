import ImageUploadCard from './ImageUploadCard';

export default function FooterUploader({ value, onChange }) {
  return (
    <ImageUploadCard
      label="Custom Footer Image (A4 Width)"
      value={value}
      type="other"
      onChange={onChange}
    />
  );
}
