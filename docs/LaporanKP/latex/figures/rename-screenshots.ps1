# rename-screenshots.ps1
# Run from inside docs/LaporanKP/latex/figures/
# Renames the 18 requirement-evidence screenshots to the clean sequential scheme.
# Matches by distinctive keyword (robust against spaces / apostrophes in current names).
# Does NOT touch gambar_*.png, *.svg, or .gitkeep.

$ErrorActionPreference = "Stop"

# keyword (unique substring of current name)  =>  new filename
$map = [ordered]@{
  "Penambahan"            = "bukti_01_penambahan_asesmen.png"
  "real-time"             = "bukti_02_visualisasi_realtime.png"
  "Permohonan"            = "bukti_03_permohonan_laporan.png"
  "antrean"               = "bukti_04_dasbor_antrean.png"
  "grafik admin"          = "bukti_05_grafik_admin.png"
  "Dropdown"              = "bukti_06_dropdown_domisili.png"
  "Lainnya"               = "bukti_07_opsi_lainnya.png"
  "Save as Image"         = "bukti_08_save_as_image.png"
  "Dynamic Sorting"       = "bukti_09_dynamic_sorting.png"
  "Manajemen 1"           = "bukti_10a_manajemen_asesmen.png"
  "Manajemen 2"           = "bukti_10b_manajemen_asesmen.png"
  "Ekspor CSV"            = "bukti_11_ekspor_csv_xls.png"
  "Filtered"              = "bukti_12_filtered_download.png"
  "Penyimpanan"           = "bukti_13_penyimpanan_sementara.png"
  "log aktivitas"         = "bukti_14_log_aktivitas.png"
  "komprehensif"          = "bukti_15_pelaporan_komprehensif.png"
  "Ekspor individual"     = "bukti_16_ekspor_individual.png"
  "Manajemen Akun"        = "bukti_18_manajemen_akun.png"
}

$pngs = Get-ChildItem -File -Filter *.png | Where-Object { $_.Name -notlike "gambar_*" }

foreach ($key in $map.Keys) {
  $target = $map[$key]
  # find the single file whose name contains the keyword (case-insensitive)
  $match = $pngs | Where-Object { $_.Name -like "*$key*" }
  if ($match.Count -eq 0) {
    Write-Warning "NO MATCH for keyword '$key' -> $target  (skipped)"
  } elseif ($match.Count -gt 1) {
    Write-Warning "MULTIPLE matches for '$key': $($match.Name -join ', ')  (skipped, rename manually)"
  } else {
    if (Test-Path $target) {
      Write-Warning "TARGET EXISTS: $target  (skipped)"
    } else {
      Rename-Item -LiteralPath $match.FullName -NewName $target
      Write-Host "OK  $($match.Name)  ->  $target"
    }
  }
}

Write-Host ""
Write-Host "Done. Verify with: Get-ChildItem bukti_*.png | Select-Object Name"
```

## After running
Confirm 18 `bukti_*.png` files exist:
```
bukti_01_penambahan_asesmen.png      bukti_10a_manajemen_asesmen.png
bukti_02_visualisasi_realtime.png    bukti_10b_manajemen_asesmen.png
bukti_03_permohonan_laporan.png      bukti_11_ekspor_csv_xls.png
bukti_04_dasbor_antrean.png          bukti_12_filtered_download.png
bukti_05_grafik_admin.png            bukti_13_penyimpanan_sementara.png
bukti_06_dropdown_domisili.png       bukti_14_log_aktivitas.png
bukti_07_opsi_lainnya.png            bukti_15_pelaporan_komprehensif.png
bukti_08_save_as_image.png           bukti_16_ekspor_individual.png
bukti_09_dynamic_sorting.png         bukti_18_manajemen_akun.png
```
If any keyword reported NO MATCH or MULTIPLE, rename that one by hand (the keyword list assumes the filenames seen in the folder screenshot).
