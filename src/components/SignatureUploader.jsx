import ImageUploadCard from './ImageUploadCard';

export default function SignatureUploader({ value, onChange }) {
  return (
    <ImageUploadCard
      label="Principal Signature"
      value={value}
      type="signature"
      onChange={onChange}
    />
  );
}
