// Tanggal hari ini menurut jam di perangkat pengguna, format YYYY-MM-DD.
// Jangan pakai new Date().toISOString().split('T')[0]: itu memakai UTC, sehingga
// di WIB (UTC+7) antara jam 00.00 dan 07.00 hasilnya jatuh ke tanggal kemarin.
export const todayLocal = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};