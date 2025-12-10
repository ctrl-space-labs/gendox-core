package dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.ss.usermodel.*;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;


@Component
public class ExcelFileReader {


    /**
     * Root method: read Excel and return a serialized String (currently CSV-ish).
     */
    public String readExcelContent(Resource resource) throws GendoxException {
        try {
            Map<String, List<List<String>>> workbookData = readExcelAsTable(resource);
            return serializeWorkbookToCsv(workbookData);
        } catch (IOException | InvalidFormatException e) {
            throw new GendoxException("ERROR_READING_EXCEL_FILE", "Error reading Excel file", HttpStatus.INTERNAL_SERVER_ERROR, e);
        } catch (Exception e) {
            throw new GendoxException("ERROR_READING_EXCEL_FILE_UNKNOWN", "Unexpected error reading Excel file", HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }

    /**
     * Reads the Excel (.xls / .xlsx) into a structured representation:
     * Map<SheetName, List<Row<List<CellValue>>>>.
     */
    public Map<String, List<List<String>>> readExcelAsTable(Resource resource)
            throws IOException, InvalidFormatException {

        try (InputStream in = resource.getInputStream();
             Workbook workbook = WorkbookFactory.create(in)) {

            DataFormatter formatter = new DataFormatter(Locale.ROOT);
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();

            Map<String, List<List<String>>> result = new LinkedHashMap<>();

            int sheetCount = workbook.getNumberOfSheets();
            for (int i = 0; i < sheetCount; i++) {
                Sheet sheet = workbook.getSheetAt(i);
                List<List<String>> rows = extractSheetData(sheet, formatter, evaluator);
                result.put(sheet.getSheetName(), rows);
            }

            return result;
        }
    }

    /**
     * Extracts all rows of a single sheet as List<List<String>>.
     */
    private List<List<String>> extractSheetData(Sheet sheet,
                                                DataFormatter formatter,
                                                FormulaEvaluator evaluator) {
        List<List<String>> rows = new ArrayList<>();

        for (Row row : sheet) {
            rows.add(extractRowData(row, formatter, evaluator));
        }

        return rows;
    }

    /**
     * Extracts a single row as List<String>, with all cells evaluated and formatted.
     */
    private List<String> extractRowData(Row row,
                                        DataFormatter formatter,
                                        FormulaEvaluator evaluator) {
        List<String> cells = new ArrayList<>();

        short lastCellNum = row.getLastCellNum(); // includes blanks between cells
        if (lastCellNum < 0) {
            // completely empty row
            return cells;
        }

        for (int c = 0; c < lastCellNum; c++) {
            Cell cell = row.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            String value = getCellValueAsString(cell, formatter, evaluator);
            cells.add(value);
        }

        return cells;
    }

    /**
     * Returns the evaluated cell value as String.
     * Uses DataFormatter + FormulaEvaluator so it behaves like Excel UI.
     */
    private String getCellValueAsString(Cell cell,
                                        DataFormatter formatter,
                                        FormulaEvaluator evaluator) {
        if (cell == null) {
            return "";
        }
        // For formulas, evaluator is used; for others it is ignored.
        return formatter.formatCellValue(cell, evaluator);
    }


    /**
     * Serialize the whole workbook Map into a single String.
     * Currently: CSV per sheet, with "# Sheet: <name>" separators.
     */
    public String serializeWorkbookToCsv(Map<String, List<List<String>>> workbookData) {
        StringBuilder out = new StringBuilder();
        boolean firstSheet = true;

        for (Map.Entry<String, List<List<String>>> entry : workbookData.entrySet()) {
            String sheetName = entry.getKey();
            List<List<String>> rows = entry.getValue();

            if (!firstSheet) {
                out.append(System.lineSeparator());
            }
            firstSheet = false;

            // Sheet header (optional; remove if not needed)
            out.append("# Sheet: ")
                    .append(sheetName)
                    .append(System.lineSeparator());

            for (List<String> row : rows) {
                out.append(serializeRowToCsv(row))
                        .append(System.lineSeparator());
            }
        }

        return out.toString();
    }

    /**
     * Serialize one row as CSV.
     */
    private String serializeRowToCsv(List<String> row) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < row.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(escapeCsv(row.get(i)));
        }
        return sb.toString();
    }

    /**
     * Minimal CSV escaping (commas, quotes, newlines).
     */
    private String escapeCsv(String value) {
        if (value == null) return "";
        boolean needsQuotes = value.contains(",")
                || value.contains("\"")
                || value.contains("\n")
                || value.contains("\r");
        String escaped = value.replace("\"", "\"\"");
        return needsQuotes ? "\"" + escaped + "\"" : escaped;
    }

}
