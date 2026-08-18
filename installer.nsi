!define PRODUCT_NAME "Mabiê Festas Gestão"
!define PRODUCT_VERSION "1.0.3"
!define PRODUCT_PUBLISHER "Mabiê Festas"
!define PRODUCT_WEB_SITE "https://www.mabiefestas.com.br"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\Mabie Festas.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKCU"

SetCompressor /SOLID lzma
Unicode true
RequestExecutionLevel user

!include "MUI2.nsh"

!define MUI_ABORTWARNING
!define MUI_ICON "d:\Estudos\aula-sql\Aplicativo\src\assets\icon.ico"
!define MUI_UNICON "d:\Estudos\aula-sql\Aplicativo\src\assets\icon.ico"

; Telas do Instalador
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\Mabie Festas.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Executar ${PRODUCT_NAME} agora"
!insertmacro MUI_PAGE_FINISH

; Telas do Desinstalador
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "PortugueseBR"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "d:\Estudos\aula-sql\Aplicativo\dist\Mabie Festas Gestão Setup 1.0.3.exe"
InstallDir "$LOCALAPPDATA\Programs\Mabie Festas Gestao"
InstallDirRegKey HKCU "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

Section "Principal" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on
  File /r "d:\Estudos\aula-sql\Mabie-Festas-App-v1.0.3\*.*"
  
  CreateDirectory "$SMPROGRAMS\Mabiê Festas"
  CreateShortCut "$SMPROGRAMS\Mabiê Festas\${PRODUCT_NAME}.lnk" "$INSTDIR\Mabie Festas.exe" "" "$INSTDIR\resources\app\src\assets\icon.ico"
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\Mabie Festas.exe" "" "$INSTDIR\resources\app\src\assets\icon.ico"
SectionEnd

Section -Post
  WriteUninstaller "$INSTDIR\uninst.exe"
  WriteRegStr HKCU "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\Mabie Festas.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\resources\app\src\assets\icon.ico"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

Section Uninstall
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\Mabiê Festas\${PRODUCT_NAME}.lnk"
  RMDir "$SMPROGRAMS\Mabiê Festas"
  RMDir /r "$INSTDIR"
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKCU "${PRODUCT_DIR_REGKEY}"
  SetAutoClose true
SectionEnd