/** Optional transfer screenshot for the payment page (the browser shows the chosen file name itself). */
export function HlProofUpload() {
  return (
    <input
      id="proof"
      name="proof"
      type="file"
      accept="image/*"
      className="w-full cursor-pointer text-[14px] text-[#c9c4d9] file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2.5 file:text-[14px] file:text-hl-fg file:transition hover:file:bg-white/15"
    />
  );
}
