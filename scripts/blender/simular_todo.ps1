# Corre la simulación de tela para cada prenda y talle que todavía no tenga su archivo en public/modelos/prendas.
# Uso (desde luna-brillante):  powershell -File scripts\blender\simular_todo.ps1 blusa sueter
param([string[]]$Prendas = @("blusa", "sueter"), [int]$Cuadros = 80)
$blender = "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"
$salida = "public\modelos\prendas"
New-Item -ItemType Directory -Force $salida | Out-Null
foreach ($p in $Prendas) {
  foreach ($t in 38, 40, 42, 44, 46, 48, 50, 52, 54) {
    $glb = "$salida\${p}_$t.glb"
    if (Test-Path $glb) { continue }
    $inicio = Get-Date
    & $blender -b --python "scripts\blender\simular_prenda.py" -- "scripts\blender\specs\${p}_$t.json" $salida $Cuadros 2>&1 | Select-String -Pattern "LISTO|Traceback|Error" | ForEach-Object { $_.Line }
    "{0} {1}: {2}s" -f $p, $t, [int]((Get-Date) - $inicio).TotalSeconds
  }
}
"TERMINADO"
