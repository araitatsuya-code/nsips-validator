// NSIPS仕様定義
const NSIPS_SPEC = {
    version: "1.06.03",
    expectedVersion: "VER010603",

    recordTypes: {
        'HEADER': { id: 'VER', name: 'ヘッダ部', required: true },
        '1': { id: '1', name: '患者情報部', required: true },
        '2': { id: '2', name: '処方箋情報部', required: true },
        '3': { id: '3', name: '用法部', required: true },
        '4': { id: '4', name: '薬品部', required: true },
        '5': { id: '5', name: '調剤録部', required: false },
        '6': { id: '6', name: '調剤録明細部', required: false },
        '7': { id: '7', name: '基本料・薬学管理料情報部', required: false },
        '8': { id: '8', name: 'お薬手帳情報部', required: false }
    },

    headerFields: [
        { name: "バージョン情報", required: true, pattern: /^VER\d{6}$/ },
        { name: "送信日時", required: true, pattern: /^\d{14}$/ },
        { name: "備考", required: false },
        { name: "送信端末識別情報", required: false },
        { name: "都道府県番号", required: true, pattern: /^\d{2}$/ },
        { name: "点数表", required: true, pattern: /^4$/ },
        { name: "薬局コード", required: true, pattern: /^\d{7}$/ },
        { name: "薬局名", required: true },
        { name: "薬局郵便番号", required: true, pattern: /^\d{7}$/ },
        { name: "薬局所在地", required: true },
        { name: "薬局電話番号", required: true, pattern: /^\d+$/ },
        { name: "旧ファイル名", required: false }
    ],

    patientFields: [
        { name: "識別子", required: true, pattern: /^1$/ },
        { name: "患者コード", required: true },
        { name: "患者カナ氏名", required: true },
        { name: "患者漢字氏名", required: true },
        { name: "性別", required: true, pattern: /^[012]$/ },
        { name: "生年月日", required: true, pattern: /^\d{8}$/ }
    ]
};

// タブ切り替え機能
function switchTab(tabName) {
    // すべてのタブとコンテンツを非アクティブにする
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // 選択されたタブとコンテンツをアクティブにする
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// フォーマット選択機能
function selectFormat(format) {
    document.querySelectorAll('#formatterTab .format-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`#formatterTab .format-option[data-format="${format}"]`).classList.add('selected');
    document.querySelector(`input[value="${format}"]`).checked = true;
}

// コンバーター選択機能
function selectConverter(converter) {
    document.querySelectorAll('#converterTab .format-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`#converterTab .format-option[data-converter="${converter}"]`).classList.add('selected');
    document.querySelector(`input[value="${converter}"]`).checked = true;
}

// Markdownフォーマット選択機能
function selectMarkdownFormat(format) {
    document.querySelectorAll('#markdownTab .format-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`#markdownTab .format-option[data-markdown-format="${format}"]`).classList.add('selected');
    document.querySelector(`input[name="markdownFormat"][value="${format}"]`).checked = true;
}

function validateData() {
    const input = document.getElementById('dataInput').value.trim();

    if (!input) {
        showError('データが入力されていません。');
        return;
    }

    try {
        const processedData = normalizeLineBreaks(input);
        const lines = processedData.lines.filter(line => line.trim());
        const results = performValidation(lines);
        results.lineBreakInfo = processedData.info;
        displayResults(results);
    } catch (error) {
        showError('バリデーション中にエラーが発生しました: ' + error.message);
    }
}

function normalizeLineBreaks(input) {
    // 改行コードの検出と正規化
    const detectionInfo = {
        originalFormat: 'unknown',
        hasEscapeSequences: false,
        detectedPatterns: [],
        processedInput: input
    };

    // エスケープシーケンスの検出
    const escapePatterns = [
        { pattern: /\\r\\n/g, type: 'CRLF escape (\\r\\n)', replacement: '\r\n' },
        { pattern: /\\n/g, type: 'LF escape (\\n)', replacement: '\n' },
        { pattern: /\\r/g, type: 'CR escape (\\r)', replacement: '\r' }
    ];

    let processedInput = input;

    // エスケープシーケンスの検出と変換
    escapePatterns.forEach(({ pattern, type, replacement }) => {
        const matches = input.match(pattern);
        if (matches) {
            detectionInfo.hasEscapeSequences = true;
            detectionInfo.detectedPatterns.push({
                type: type,
                count: matches.length
            });
            processedInput = processedInput.replace(pattern, replacement);
        }
    });

    // 実際の改行コードの検出
    const lineBreakPatterns = [
        { pattern: /\r\n/g, type: 'CRLF (Windows)', name: 'crlf' },
        { pattern: /\n/g, type: 'LF (Unix/Linux)', name: 'lf' },
        { pattern: /\r/g, type: 'CR (Classic Mac)', name: 'cr' }
    ];

    let detectedLineBreak = null;
    for (const { pattern, type, name } of lineBreakPatterns) {
        const matches = processedInput.match(pattern);
        if (matches && matches.length > 0) {
            if (!detectedLineBreak || matches.length > detectedLineBreak.count) {
                detectedLineBreak = {
                    type: type,
                    name: name,
                    count: matches.length
                };
            }
        }
    }

    if (detectedLineBreak) {
        detectionInfo.originalFormat = detectedLineBreak.type;
        detectionInfo.detectedPatterns.push({
            type: detectedLineBreak.type,
            count: detectedLineBreak.count
        });
    }

    // 正規化（すべてLFに統一）
    const normalizedInput = processedInput.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    return {
        lines: normalizedInput.split('\n'),
        info: detectionInfo
    };
}

function performValidation(lines) {
    const results = {
        total: lines.length,
        valid: 0,
        warnings: 0,
        errors: 0,
        records: [],
        version: null
    };

    lines.forEach((line, index) => {
        // 先頭のスペースやタブを削除してから処理
        const trimmedLine = line.trimStart();
        const fields = trimmedLine.split(',');
        const recordType = fields[0];

        const recordResult = {
            lineNumber: index + 1,
            recordType: recordType,
            typeName: getRecordTypeName(recordType),
            fieldCount: fields.length,
            status: 'valid',
            issues: [],
            fields: fields
        };

        // バージョン情報の抽出
        if (index === 0) {
            results.version = recordType;
            validateVersion(recordType, recordResult);
        }

        // レコードタイプ別バリデーション
        validateRecord(recordType, fields, recordResult);

        // 結果の集計
        if (recordResult.status === 'error') {
            results.errors++;
        } else if (recordResult.status === 'warning') {
            results.warnings++;
        } else {
            results.valid++;
        }

        results.records.push(recordResult);
    });

    return results;
}

function validateVersion(version, recordResult) {
    if (version !== NSIPS_SPEC.expectedVersion) {
        recordResult.issues.push({
            type: 'warning',
            message: `バージョン不一致: ${version} (期待値: ${NSIPS_SPEC.expectedVersion})`
        });
        recordResult.status = 'warning';
    }
}

function validateRecord(recordType, fields, recordResult) {
    if (recordType.startsWith('VER')) {
        validateHeaderRecord(fields, recordResult);
    } else if (recordType === '1') {
        validatePatientRecord(fields, recordResult);
    } else if (recordType === '2') {
        validatePrescriptionRecord(fields, recordResult);
    } else if (recordType === '3') {
        validateUsageRecord(fields, recordResult);
    } else if (recordType === '4') {
        validateMedicineRecord(fields, recordResult);
    } else if (['5', '6', '7', '8'].includes(recordType)) {
        validateOptionalRecord(recordType, fields, recordResult);
    } else {
        recordResult.issues.push({
            type: 'error',
            message: '不明なレコードタイプです'
        });
        recordResult.status = 'error';
    }
}

function validateHeaderRecord(fields, recordResult) {
    NSIPS_SPEC.headerFields.forEach((spec, index) => {
        if (index >= fields.length) {
            if (spec.required) {
                recordResult.issues.push({
                    type: 'error',
                    message: `必須項目が不足: ${spec.name}`
                });
                recordResult.status = 'error';
            }
            return;
        }

        const value = fields[index];
        if (spec.required && (!value || value.trim() === '')) {
            recordResult.issues.push({
                type: 'error',
                message: `必須項目が空白: ${spec.name}`
            });
            recordResult.status = 'error';
        }

        if (spec.pattern && value && !spec.pattern.test(value)) {
            recordResult.issues.push({
                type: 'warning',
                message: `フォーマット不正: ${spec.name} (${value})`
            });
            if (recordResult.status === 'valid') {
                recordResult.status = 'warning';
            }
        }
    });
}

function validatePatientRecord(fields, recordResult) {
    if (fields.length < 6) {
        recordResult.issues.push({
            type: 'error',
            message: '必須項目が不足しています'
        });
        recordResult.status = 'error';
        return;
    }

    // 性別チェック
    if (fields[4] && !['0', '1', '2'].includes(fields[4])) {
        recordResult.issues.push({
            type: 'warning',
            message: `性別コードが不正: ${fields[4]}`
        });
        if (recordResult.status === 'valid') {
            recordResult.status = 'warning';
        }
    }

    // 生年月日チェック
    if (fields[5] && !/^\d{8}$/.test(fields[5])) {
        recordResult.issues.push({
            type: 'warning',
            message: `生年月日フォーマット不正: ${fields[5]}`
        });
        if (recordResult.status === 'valid') {
            recordResult.status = 'warning';
        }
    }
}

function validatePrescriptionRecord(fields, recordResult) {
    if (fields.length < 15) {
        recordResult.issues.push({
            type: 'error',
            message: '必須項目が不足しています'
        });
        recordResult.status = 'error';
    }
}

function validateUsageRecord(fields, recordResult) {
    if (fields.length < 12) {
        recordResult.issues.push({
            type: 'error',
            message: '必須項目が不足しています'
        });
        recordResult.status = 'error';
    }
}

function validateMedicineRecord(fields, recordResult) {
    if (fields.length < 19) {
        recordResult.issues.push({
            type: 'error',
            message: '必須項目が不足しています'
        });
        recordResult.status = 'error';
    }
}

function validateOptionalRecord(recordType, fields, recordResult) {
    recordResult.issues.push({
        type: 'info',
        message: '省略可項目として正常に処理されました'
    });
}

function getRecordTypeName(recordType) {
    if (recordType.startsWith('VER')) {
        return 'ヘッダ部';
    }
    const spec = NSIPS_SPEC.recordTypes[recordType];
    return spec ? spec.name : '不明';
}

function displayResults(results) {
    const section = document.getElementById('resultsSection');
    const versionInfo = document.getElementById('versionInfo');
    const versionText = document.getElementById('versionText');
    const statsSection = document.getElementById('statsSection');
    const resultsDiv = document.getElementById('validationResults');

    // 統計情報の更新
    document.getElementById('totalRecords').textContent = results.total;
    document.getElementById('validRecords').textContent = results.valid;
    document.getElementById('warningRecords').textContent = results.warnings;
    document.getElementById('errorRecords').textContent = results.errors;

    // バージョン情報の表示
    if (results.version) {
        versionText.textContent = results.version;
        versionInfo.classList.remove('hidden');
    }

    // 改行コード情報の表示
    let html = '';
    if (results.lineBreakInfo) {
        html += generateLineBreakInfo(results.lineBreakInfo);
    }

    // 結果の表示
    results.records.forEach(record => {
        const statusClass = `result-${record.status}`;
        const icon = record.status === 'valid' ? '✅' :
            record.status === 'warning' ? '⚠️' : '❌';

        html += `
            <div class="validation-result ${statusClass}">
                <div class="record-header">
                    ${icon} 行 ${record.lineNumber}: ${record.typeName} (識別子: ${record.recordType})
                </div>
                
                ${record.issues.length > 0 ? `
                    <div style="margin: 10px 0;">
                        ${record.issues.map(issue => `
                            <div style="margin: 5px 0;">• ${issue.message}</div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="record-details">
                    <div style="margin-bottom: 10px;">
                        <strong>フィールド数:</strong> ${record.fieldCount}
                    </div>
                    ${generateFieldDetails(record)}
                </div>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
    statsSection.classList.remove('hidden');
    section.classList.remove('hidden');

    // アイコンの更新
    const icon = results.errors > 0 ? '❌' :
        results.warnings > 0 ? '⚠️' : '✅';
    document.getElementById('resultsIcon').textContent = icon;
}

function generateLineBreakInfo(lineBreakInfo) {
    if (!lineBreakInfo.detectedPatterns.length && !lineBreakInfo.hasEscapeSequences) {
        return '';
    }

    let html = `
        <div class="validation-result" style="background: #f0f9ff; border-color: #0284c7; color: #0c4a6e;">
            <div class="record-header">
                📝 改行コード検出結果
            </div>
            <div style="margin: 10px 0;">
    `;

    if (lineBreakInfo.hasEscapeSequences) {
        html += `<div style="margin: 5px 0;">
            <strong>エスケープシーケンス検出:</strong> データ内にエスケープ文字列が含まれていました
        </div>`;
    }

    if (lineBreakInfo.originalFormat !== 'unknown') {
        html += `<div style="margin: 5px 0;">
            <strong>検出された改行形式:</strong> ${lineBreakInfo.originalFormat}
        </div>`;
    }

    if (lineBreakInfo.detectedPatterns.length > 0) {
        html += `<div style="margin: 5px 0;">
            <strong>詳細パターン:</strong>
            <ul style="margin: 5px 0 0 20px;">`;

        lineBreakInfo.detectedPatterns.forEach(pattern => {
            html += `<li>${pattern.type}: ${pattern.count}箇所</li>`;
        });

        html += `</ul></div>`;
    }

    html += `<div style="margin: 5px 0; font-style: italic; color: #0369a1;">
        自動的に標準形式（LF）に正規化して処理しました
    </div></div></div>`;

    return html;
}

function generateFieldDetails(record) {
    let html = '';
    const maxDisplay = 10; // 表示する最大フィールド数

    record.fields.slice(0, maxDisplay).forEach((field, index) => {
        const fieldName = getFieldName(record.recordType, index);
        const isEmpty = !field || field.trim() === '';

        html += `
            <div class="field-info">
                <div class="field-label">${index + 1}:</div>
                <div class="field-value">${fieldName}</div>
                <div class="field-status">
                    ${isEmpty ? '(空白)' : field.length > 30 ? field.substring(0, 30) + '...' : field}
                </div>
            </div>
        `;
    });

    if (record.fields.length > maxDisplay) {
        html += `<div style="text-align: center; color: #718096; margin-top: 10px;">
            他 ${record.fields.length - maxDisplay} フィールド...
        </div>`;
    }

    return html;
}

function getFieldName(recordType, index) {
    if (recordType.startsWith('VER') && NSIPS_SPEC.headerFields[index]) {
        return NSIPS_SPEC.headerFields[index].name;
    }
    if (recordType === '1' && NSIPS_SPEC.patientFields[index]) {
        return NSIPS_SPEC.patientFields[index].name;
    }
    return `項番${index + 1}`;
}

function loadSampleData() {
    const sampleData = `VER010603,20250722153322,,PCCLIENT1,14,4,0842302,テスト薬局,2360042,神奈川県横浜市金沢区テスト町1-2-3,0457111111,
1,,ﾔﾏﾀﾞ ﾀﾛｳ,山田　太郎,1,19800101,2360045,神奈川県横浜市金沢区サンプル町4-5-6,,,08011112222,,2,2,144105,20230801,７０,12345678,1,20,80,0,,,,,,,,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,
2,990235520035206,41,U,20250722,,,20250722,0,0,0,206,0800052,14,サンプル病院,2360037,横浜市金沢区テスト東1-2-3,0457333333,49,内科,,,794,ｻﾄｳ ｼﾞﾛｳ,佐藤　次郎,0,,,,,,,,,0,0,0,0,0,0,0,0
3,1,*1000,１日１回　朝食後服用,,,,,2,1,70,0,,1,0,0,,,,,,
4,1,1,1,3969010F2030,621951001,,ｻﾝﾌﾟﾙ50,サンプル錠５０ｍｇ,テスト成分錠５０ｍｇ,0,0,0,0,0,0,1,1,錠,0,0,0,0,1,82.1,,,,,,,,0,,,,,,,,
5,560,0,0,0,448,0,0,0,0,0,0,560,0,0,0,0,0,0,0,0
6,1,0,8,70,560,0,560,,,,,,,,,,,,,,,,,,,,`;

    document.getElementById('dataInput').value = sampleData;
}

function loadEscapeSequenceData() {
    // エスケープシーケンス形式のサンプルデータ
    const escapeData = `VER010603,20250722153322,,PCCLIENT1,14,4,0842302,テスト薬局,2360042,神奈川県横浜市金沢区テスト町1-2-3,0457111111,\\n1,,ﾔﾏﾀﾞ ﾀﾛｳ,山田　太郎,1,19800101,2360045,神奈川県横浜市金沢区サンプル町4-5-6,,,08011112222,,2,2,144105,20230801,７０,12345678,1,20,80,0,,,,,,,,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,\\n2,990235520035206,41,U,20250722,,,20250722,0,0,0,206,0800052,14,サンプル病院,2360037,横浜市金沢区テスト東1-2-3,0457333333,49,内科,,,794,ｻﾄｳ ｼﾞﾛｳ,佐藤　次郎,0,,,,,,,,,0,0,0,0,0,0,0,0\\n3,1,*1000,１日１回　朝食後服用,,,,,2,1,70,0,,1,0,0,,,,,,\\n4,1,1,1,3969010F2030,621951001,,ｻﾝﾌﾟﾙ50,サンプル錠５０ｍｇ,テスト成分錠５０ｍｇ,0,0,0,0,0,0,1,1,錠,0,0,0,0,1,82.1,,,,,,,,0,,,,,,,,`;

    document.getElementById('dataInput').value = escapeData;
}

function clearData() {
    document.getElementById('dataInput').value = '';
    document.getElementById('resultsSection').classList.add('hidden');
}

function showError(message) {
    const section = document.getElementById('resultsSection');
    const resultsDiv = document.getElementById('validationResults');

    resultsDiv.innerHTML = `
        <div class="validation-result result-error">
            <div class="record-header">❌ エラー</div>
            <div>${message}</div>
        </div>
    `;

    document.getElementById('statsSection').classList.add('hidden');
    document.getElementById('versionInfo').classList.add('hidden');
    section.classList.remove('hidden');
}

// データフォーマット機能
function formatData() {
    const input = document.getElementById('formatterInput').value.trim();
    const selectedFormat = document.querySelector('input[name="format"]:checked').value;

    if (!input) {
        showFormatterError('データが入力されていません。');
        return;
    }

    try {
        let result = '';

        switch (selectedFormat) {
            case 'json':
                const parsed = JSON.parse(input);
                result = JSON.stringify(parsed, null, 2);
                break;

            case 'csv':
                result = formatCSV(input);
                break;

            case 'minify':
                const minified = JSON.parse(input);
                result = JSON.stringify(minified);
                break;

            default:
                throw new Error('未対応のフォーマットです');
        }

        displayFormatterResult(result, selectedFormat);

    } catch (error) {
        showFormatterError('フォーマット中にエラーが発生しました: ' + error.message);
    }
}

// CSV整形機能
function formatCSV(input) {
    // 改行文字を処理（NSIPSバリデーターと同様）
    const processedData = normalizeLineBreaks(input);
    
    const lines = processedData.lines.filter(line => line.trim());
    const formatted = lines.map(line => {
        // 先頭のスペースやタブを削除してから処理
        const trimmedLine = line.trimStart();
        // 各フィールドをそのまま保持（空白フィールドも維持）
        const fields = trimmedLine.split(',');
        return fields.join(',');
    });
    return formatted.join('\n');
}

// データ変換機能
function convertData() {
    const input = document.getElementById('converterInput').value.trim();
    const selectedConverter = document.querySelector('input[name="converter"]:checked').value;

    if (!input) {
        showConverterError('データが入力されていません。');
        return;
    }

    try {
        let result = '';

        switch (selectedConverter) {
            case 'json-to-csv':
                result = jsonToCsv(JSON.parse(input));
                break;

            case 'csv-to-json':
                result = JSON.stringify(csvToJson(input), null, 2);
                break;

            case 'nsips-to-json':
                result = JSON.stringify(nsipsToJson(input), null, 2);
                break;

            default:
                throw new Error('未対応の変換形式です');
        }

        displayConverterResult(result, selectedConverter);

    } catch (error) {
        showConverterError('変換中にエラーが発生しました: ' + error.message);
    }
}

// JSON to CSV 変換
function jsonToCsv(jsonData) {
    if (!Array.isArray(jsonData)) {
        throw new Error('CSVに変換するにはJSONの配列が必要です');
    }

    if (jsonData.length === 0) return '';

    const headers = Object.keys(jsonData[0]);
    const csvContent = [
        headers.join(','),
        ...jsonData.map(row =>
            headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',')
                    ? `"${value}"`
                    : value;
            }).join(',')
        )
    ].join('\n');

    return csvContent;
}

// CSV to JSON 変換
function csvToJson(csvData) {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSVには最低2行（ヘッダー+データ）が必要です');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const jsonArray = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        jsonArray.push(obj);
    }

    return jsonArray;
}

// NSIPS to JSON 変換
function nsipsToJson(nsipsData) {
    // 改行文字を処理（NSIPSバリデーターと同様）
    const processedData = normalizeLineBreaks(nsipsData);
    const lines = processedData.lines.filter(line => line.trim());
    const result = {
        header: null,
        patient: null,
        prescriptions: [],
        usages: [],
        medicines: [],
        dispensing: [],
        dispensingDetails: []
    };

    lines.forEach(line => {
        // 先頭のスペースやタブを削除してから処理
        const trimmedLine = line.trimStart();
        const fields = trimmedLine.split(',');
        const recordType = fields[0];

        switch (recordType) {
            case 'VER010603':
            case 'VER010602':
            case 'VER010401':
                result.header = {
                    version: fields[0],
                    sendDateTime: fields[1],
                    pharmacyCode: fields[6],
                    pharmacyName: fields[7],
                    pharmacyAddress: fields[9]
                };
                break;

            case '1':
                result.patient = {
                    patientCode: fields[1],
                    patientKanaName: fields[2],
                    patientKanjiName: fields[3],
                    gender: fields[4],
                    birthDate: fields[5],
                    address: fields[7]
                };
                break;

            case '2':
                result.prescriptions.push({
                    prescriptionNumber: fields[1],
                    receptionNumber: fields[2],
                    updateType: fields[3],
                    prescriptionDate: fields[4],
                    dispensingDate: fields[7],
                    hospitalName: fields[14],
                    doctorName: fields[24]
                });
                break;

            case '3':
                result.usages.push({
                    rpNumber: fields[1],
                    usageCode: fields[2],
                    usageName: fields[3],
                    rpCategory: fields[8],
                    dayCount: fields[10]
                });
                break;

            case '4':
                result.medicines.push({
                    medicineNumber: fields[1],
                    rpNumber: fields[2],
                    yjCode: fields[4],
                    medicineName: fields[8],
                    genericName: fields[9],
                    dosage: fields[16],
                    unit: fields[18]
                });
                break;
        }
    });

    return result;
}

// フォーマッター結果表示
function displayFormatterResult(result, format) {
    const section = document.getElementById('formatterResults') || createFormatterResultsSection();

    section.innerHTML = `
        <div class="validation-result result-success">
            <div class="record-header">
                ✅ ${format.toUpperCase()}整形完了
            </div>
            <div class="record-details">
                <pre style="white-space: pre-wrap; max-height: 400px; overflow-y: auto;">${result}</pre>
            </div>
            <div class="button-group" style="margin-top: 15px;">
                <button class="btn btn-secondary" onclick="copyToClipboard('${btoa(encodeURIComponent(result))}')">
                    <span>📋</span>結果をコピー
                </button>
            </div>
        </div>
    `;

    section.classList.remove('hidden');
}

// コンバーター結果表示
function displayConverterResult(result, converter) {
    const section = document.getElementById('converterResults') || createConverterResultsSection();

    section.innerHTML = `
        <div class="validation-result result-success">
            <div class="record-header">
                ✅ ${converter}変換完了
            </div>
            <div class="record-details">
                <pre style="white-space: pre-wrap; max-height: 400px; overflow-y: auto;">${result}</pre>
            </div>
            <div class="button-group" style="margin-top: 15px;">
                <button class="btn btn-secondary" onclick="copyToClipboard('${btoa(encodeURIComponent(result))}')">
                    <span>📋</span>結果をコピー
                </button>
            </div>
        </div>
    `;

    section.classList.remove('hidden');
}

// 結果セクション作成
function createFormatterResultsSection() {
    const section = document.createElement('div');
    section.id = 'formatterResults';
    section.className = 'results-section';
    document.getElementById('formatterTab').appendChild(section);
    return section;
}

function createConverterResultsSection() {
    const section = document.createElement('div');
    section.id = 'converterResults';
    section.className = 'results-section';
    document.getElementById('converterTab').appendChild(section);
    return section;
}

// クリップボードにコピー
function copyToClipboard(encodedText) {
    const text = decodeURIComponent(atob(encodedText));
    navigator.clipboard.writeText(text).then(() => {
        alert('結果をクリップボードにコピーしました！');
    });
}

// エラー表示
function showFormatterError(message) {
    const section = document.getElementById('formatterResults') || createFormatterResultsSection();
    section.innerHTML = `
        <div class="validation-result result-error">
            <div class="record-header">❌ エラー</div>
            <div>${message}</div>
        </div>
    `;
    section.classList.remove('hidden');
}

function showConverterError(message) {
    const section = document.getElementById('converterResults') || createConverterResultsSection();
    section.innerHTML = `
        <div class="validation-result result-error">
            <div class="record-header">❌ エラー</div>
            <div>${message}</div>
        </div>
    `;
    section.classList.remove('hidden');
}

// サンプルデータ読み込み
function loadFormatterSample() {
    const sampleJson = `{"prescription_number":"20250714112","dispense_date":"2025-07-14","prescriptions":[{"prescription_id":8997223,"institution_name":"テスト病院A","doctor_name":"テスト 医師","department_name":"皮膚科","drugs":[{"name":"プレドニゾロン錠１ｍｇ","dose":1.5,"unit":"錠"}]}]}`;
    document.getElementById('formatterInput').value = sampleJson;
}

function loadConverterSample() {
    const converter = document.querySelector('input[name="converter"]:checked').value;
    let sample = '';

    switch (converter) {
        case 'json-to-csv':
            sample = `[{"name":"テスト太郎","age":25,"department":"内科"},{"name":"サンプル花子","age":30,"department":"外科"}]`;
            break;
        case 'csv-to-json':
            sample = `name,age,department\nテスト太郎,25,内科\nサンプル花子,30,外科`;
            break;
        case 'nsips-to-json':
            sample = `VER010603,20250722153322,,PCCLIENT1,14,4,0842302,テスト薬局,2360042,神奈川県横浜市金沢区テスト町1-2-3,0457111111,\n1,,ﾔﾏﾀﾞ ﾀﾛｳ,山田　太郎,1,19800101,2360045,神奈川県横浜市金沢区サンプル町4-5-6,,,08011112222,,2,2,144105,20230801,７０,12345678,1,20,80,0,,,,,,,,,,,,,,,,0,0,0,0,0,0,0,0,0,0,0,`;
            break;
    }

    document.getElementById('converterInput').value = sample;
}

// クリア機能
function clearFormatter() {
    document.getElementById('formatterInput').value = '';
    const section = document.getElementById('formatterResults');
    if (section) section.classList.add('hidden');
}

function clearConverter() {
    document.getElementById('converterInput').value = '';
    const section = document.getElementById('converterResults');
    if (section) section.classList.add('hidden');
}

// Markdownテーブル変換機能
function convertToMarkdown() {
    const input = document.getElementById('markdownInput').value.trim();
    const selectedFormat = document.querySelector('input[name="markdownFormat"]:checked').value;
    const includeAlignment = document.getElementById('includeAlignment').checked;
    const escapeSpecialChars = document.getElementById('escapeSpecialChars').checked;

    if (!input) {
        document.getElementById('markdownOutput').value = '';
        return;
    }

    try {
        let tableData = [];

        // フォーマット別の解析
        if (selectedFormat === 'auto') {
            tableData = autoDetectAndParse(input);
        } else {
            switch (selectedFormat) {
                case 'csv':
                    tableData = parseCSV(input);
                    break;
                case 'tsv':
                    tableData = parseTSV(input);
                    break;
                case 'json':
                    tableData = parseJSONArray(input);
                    break;
                case 'html':
                    tableData = parseHTMLTable(input);
                    break;
                default:
                    throw new Error('未対応のフォーマットです');
            }
        }

        if (tableData.length === 0) {
            throw new Error('有効な表データが見つかりません');
        }

        const markdownTable = generateMarkdownTable(tableData, includeAlignment, escapeSpecialChars);
        document.getElementById('markdownOutput').value = markdownTable;

    } catch (error) {
        document.getElementById('markdownOutput').value = `エラー: ${error.message}`;
    }
}

// 自動検出とパース
function autoDetectAndParse(input) {
    // HTMLテーブルの検出
    if (input.includes('<table') || input.includes('<tr') || input.includes('<td')) {
        return parseHTMLTable(input);
    }

    // JSONの検出
    if ((input.startsWith('[') && input.endsWith(']')) || (input.startsWith('{') && input.endsWith('}'))) {
        try {
            return parseJSONArray(input);
        } catch (e) {
            // JSONパースに失敗した場合は他の形式を試す
        }
    }

    // TSV (タブ区切り) の検出
    if (input.includes('\t')) {
        return parseTSV(input);
    }

    // CSV (カンマ区切り) の検出
    if (input.includes(',')) {
        return parseCSV(input);
    }

    // スペース区切りやその他の区切り文字
    return parseDelimited(input);
}

// CSV解析
function parseCSV(input) {
    const lines = input.trim().split('\n');
    return lines.map(line => {
        // 簡単なCSVパーサー（クオート対応）
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    });
}

// TSV解析
function parseTSV(input) {
    const lines = input.trim().split('\n');
    return lines.map(line => line.split('\t').map(cell => cell.trim()));
}

// JSON配列解析
function parseJSONArray(input) {
    const data = JSON.parse(input);
    if (!Array.isArray(data)) {
        throw new Error('JSON配列が必要です');
    }

    if (data.length === 0) {
        return [];
    }

    // オブジェクトの配列の場合
    if (typeof data[0] === 'object') {
        const headers = Object.keys(data[0]);
        const result = [headers];
        data.forEach(obj => {
            result.push(headers.map(header => obj[header] || ''));
        });
        return result;
    }

    // プリミティブ値の配列の場合
    return [['値'], ...data.map(item => [item])];
}

// HTMLテーブル解析
function parseHTMLTable(input) {
    // 一時的なDIV要素を作成してHTMLを解析
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = input;

    const table = tempDiv.querySelector('table');
    if (!table) {
        throw new Error('HTMLテーブルが見つかりません');
    }

    const result = [];
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        const rowData = Array.from(cells).map(cell => cell.textContent.trim());
        if (rowData.length > 0) {
            result.push(rowData);
        }
    });

    return result;
}

// 区切り文字による解析（フォールバック）
function parseDelimited(input) {
    const lines = input.trim().split('\n');
    return lines.map(line => {
        // スペース、タブ、パイプなどで区切りを試す
        if (line.includes('|')) {
            return line.split('|').map(cell => cell.trim());
        } else if (line.includes('\t')) {
            return line.split('\t').map(cell => cell.trim());
        } else {
            // 複数のスペースで区切る
            return line.split(/\s{2,}/).map(cell => cell.trim());
        }
    });
}

// Markdownテーブル生成
function generateMarkdownTable(data, includeAlignment, escapeSpecialChars) {
    if (data.length === 0) {
        return '';
    }

    // 特殊文字のエスケープ
    const escapeCell = (cell) => {
        if (!escapeSpecialChars) return cell;
        return String(cell)
            .replace(/\|/g, '\\|')
            .replace(/\n/g, '<br>')
            .replace(/\r/g, '');
    };

    // 列幅の計算（整列用）
    const columnCount = Math.max(...data.map(row => row.length));
    const columnWidths = Array(columnCount).fill(0);

    data.forEach(row => {
        row.forEach((cell, index) => {
            columnWidths[index] = Math.max(columnWidths[index], String(cell).length);
        });
    });

    let result = [];

    // ヘッダー行
    const headerRow = data[0].map((cell, index) => {
        const escaped = escapeCell(cell);
        return includeAlignment ? escaped.padEnd(columnWidths[index]) : escaped;
    });
    result.push('| ' + headerRow.join(' | ') + ' |');

    // セパレータ行
    const separator = columnWidths.map(width => {
        if (includeAlignment) {
            return '-'.repeat(Math.max(3, width));
        } else {
            return '---';
        }
    });
    result.push('| ' + separator.join(' | ') + ' |');

    // データ行
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const paddedRow = [];

        for (let j = 0; j < columnCount; j++) {
            const cell = row[j] || '';
            const escaped = escapeCell(cell);
            paddedRow.push(includeAlignment ? escaped.padEnd(columnWidths[j]) : escaped);
        }

        result.push('| ' + paddedRow.join(' | ') + ' |');
    }

    return result.join('\n');
}

// Markdownサンプルデータ読み込み
function loadMarkdownSample() {
    const format = document.querySelector('input[name="markdownFormat"]:checked').value;
    let sample = '';

    switch (format) {
        case 'csv':
            sample = `名前,年齢,部署,給与
山田太郎,25,営業部,350000
佐藤花子,30,開発部,450000
田中次郎,28,企画部,400000`;
            break;

        case 'tsv':
            sample = `名前	年齢	部署	給与
山田太郎	25	営業部	350000
佐藤花子	30	開発部	450000
田中次郎	28	企画部	400000`;
            break;

        case 'json':
            sample = `[
  {"名前": "山田太郎", "年齢": 25, "部署": "営業部", "給与": 350000},
  {"名前": "佐藤花子", "年齢": 30, "部署": "開発部", "給与": 450000},
  {"名前": "田中次郎", "年齢": 28, "部署": "企画部", "給与": 400000}
]`;
            break;

        case 'html':
            sample = `<table>
  <tr>
    <th>名前</th>
    <th>年齢</th>
    <th>部署</th>
    <th>給与</th>
  </tr>
  <tr>
    <td>山田太郎</td>
    <td>25</td>
    <td>営業部</td>
    <td>350000</td>
  </tr>
  <tr>
    <td>佐藤花子</td>
    <td>30</td>
    <td>開発部</td>
    <td>450000</td>
  </tr>
  <tr>
    <td>田中次郎</td>
    <td>28</td>
    <td>企画部</td>
    <td>400000</td>
  </tr>
</table>`;
            break;

        default: // auto
            sample = `名前,年齢,部署,給与
山田太郎,25,営業部,350000
佐藤花子,30,開発部,450000
田中次郎,28,企画部,400000`;
            break;
    }

    document.getElementById('markdownInput').value = sample;
    convertToMarkdown(); // 自動変換
}

// Markdown結果をコピー
function copyMarkdownResult() {
    const output = document.getElementById('markdownOutput').value;
    if (output) {
        navigator.clipboard.writeText(output).then(() => {
            alert('Markdownテーブルをクリップボードにコピーしました！');
        });
    } else {
        alert('コピーするデータがありません。');
    }
}

// Markdownクリア
function clearMarkdown() {
    document.getElementById('markdownInput').value = '';
    document.getElementById('markdownOutput').value = '';
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('医療データツールボックス Ver. 1.06.03 対応版が読み込まれました');

    // タブ切り替えイベントリスナー
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // フォーマット選択イベントリスナー
    document.querySelectorAll('#formatterTab .format-option').forEach(option => {
        option.addEventListener('click', function() {
            const format = this.getAttribute('data-format');
            selectFormat(format);
        });
    });

    // コンバーター選択イベントリスナー
    document.querySelectorAll('#converterTab .format-option').forEach(option => {
        option.addEventListener('click', function() {
            const converter = this.getAttribute('data-converter');
            selectConverter(converter);
        });
    });

    // Markdownフォーマット選択イベントリスナー
    document.querySelectorAll('#markdownTab .format-option').forEach(option => {
        option.addEventListener('click', function() {
            const format = this.getAttribute('data-markdown-format');
            selectMarkdownFormat(format);
        });
    });

    // デフォルトでバリデータータブを表示
    switchTab('validator');

    // Markdownリアルタイム変換の設定
    setTimeout(() => {
        const markdownInput = document.getElementById('markdownInput');
        if (markdownInput) {
            markdownInput.addEventListener('input', convertToMarkdown);
        }
    }, 100);
});