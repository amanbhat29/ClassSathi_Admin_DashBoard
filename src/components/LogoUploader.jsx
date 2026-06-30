import ImageUploadCard from './ImageUploadCard';

export default function LogoUploader({ value, onChange }) {
  return (
    <ImageUploadCard
      label="School Logo"
      value={value}
      type="logo"
      onChange={onChange}
    />
  );
}
