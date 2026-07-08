# Implementation Plan - Attendance Tracker Application

A premium, modern attendance tracker designed for offline-first local storage, responsive mobile/APK use, and visual excellence (glassmorphism, vibrant colors, clean layouts).

## User Review Required

> [!IMPORTANT]
> The app is built as a highly responsive Single Page Application (SPA) using HTML5, CSS3, and modern vanilla JavaScript. This ensures compatibility with Android WebView wrapper tools (like Capacitor or Cordova) to easily generate a mobile APK.

### Architecture & Design Highlights
* **Color Themes**: Support for Dark, Light, and System themes, utilizing modern CSS custom properties (variables) for transition effects.
* **Timetable Representation**: A real, visual table grid layout mapping days (Monday to Saturday) to periods, showing **Course Short Form** and **Faculty Initial** with color-coding corresponding to the subject's color.
* **Local Storage Integration**: All tables (Subjects, Timetable, Attendance, Settings) are stored in `localStorage` as JSON.
* **"What If?" Calculator**: An interactive playground on the Dashboard or Statistics page allowing instant scenario analysis.

---

## Proposed Changes

### Project Structure
* [index.html](file:///c:/Users/laksh/OneDrive%20-%20Shiv%20Nadar%20University%20-%20Chennai/Others/Timepass%20Webapps/Attendance%20Tracker/index.html) [NEW]: Core structure, sidebar layout, view containers.
* [styles.css](file:///c:/Users/laksh/OneDrive%20-%20Shiv%20Nadar%20University%20-%20Chennai/Others/Timepass%20Webapps/Attendance%20Tracker/styles.css) [NEW]: CSS design system, typography (Outfit/Inter), animations, layouts.
* [app.js](file:///c:/Users/laksh/OneDrive%20-%20Shiv%20Nadar%20University%20-%20Chennai/Others/Timepass%20Webapps/Attendance%20Tracker/app.js) [NEW]: Application logic, routers, database controls, calculators.

---

### Data Models (Local Storage)

#### 1. Subjects (`subjects`)
```json
[
  {
    "id": "sub_1718000000000",
    "title": "Machine Learning",
    "shortForm": "ML",
    "code": "CS-401",
    "facultyName": "Dr. Ramesh Kumar",
    "facultyInitial": "RK",
    "credits": 4,
    "color": "#6366f1",
    "targetPercent": 75
  }
]
```

#### 2. Timetable (`timetable`)
Mapped by day of week (`mon`, `tue`, `wed`, `thu`, `fri`, `sat`).
```json
{
  "mon": [
    {
      "id": "period_1",
      "periodNumber": 1,
      "subjectId": "sub_1718000000000",
      "startTime": "09:00",
      "endTime": "09:55",
      "room": "LHC-101"
    }
  ]
}
```

#### 3. Attendance Records (`attendance`)
Keyed by date `YYYY-MM-DD` for rapid lookup, mapping `periodId` to status.
```json
{
  "2026-07-08": {
    "period_1": {
      "subjectId": "sub_1718000000000",
      "status": "attended",
      "timestamp": 1718000000000
    }
  }
}
```

#### 4. Settings (`settings`)
```json
{
  "globalTarget": 75,
  "theme": "system"
}
```

---

## Detailed View Design

### 1. Sidebar & Navigation
* Modern responsive sidebar with a header, navigation items with clean icons (Lucide Icons), and responsive mobile bottom-bar.

### 2. Dashboard
* **Header**: Shows current day, date, and general status (warning message if any subject is below 75% or 70%).
* **Today's Classes**: Chronological cards matching the day's timetable.
  * Easy tap-to-mark: `✔ Attended`, `❌ Bunked`, `🟠 OD`, `⚪ Cancelled`.
  * After marking: disables other options, saves instantly, and offers an "Edit" button to change state.
* **Attendance Summary**: Colored progress bars and circles for all subjects.
  * Green: `> 80%`
  * Orange: `75% - 80%`
  * Red: `< 75%`
* **Quick Stats Cards**: Summary values (Overall %, Classes Attended, Missed, OD, Cancelled, Total Conducted).
* **"What If?" Calculator**: Quick simulation interface.

### 3. Timetable Page
* Visual HTML `<table>` showing columns for Monday through Saturday.
* Edit Mode:
  * Select day tab to see list of periods.
  * Allow adding, editing, and deleting periods (linking to subjects, specifying start/end times, room).
  * Reordering periods.
  * **Actions**: "Copy Day's Timetable to...", "Copy Entire Week's Timetable (Export JSON/Copy)".

### 4. Subjects Page
* List of all active subjects styled as dynamic grid cards.
* Dialog modals to Add and Edit subjects.
  * Required fields: **Course Title**, **Course Short Form**, **Faculty Initial**.
  * Optional fields: Course Code, Faculty Name, Credits.
  * Color Picker (preset of curated premium palettes).
  * Target attendance input (defaults to 75%).
* Delete confirmation.

### 5. Attendance Page
* Full monthly calendar wrapper on top (with next/prev month toggles).
* Clicking a date renders the schedule list for that date.
* Allows editing status for any past class.

### 6. Statistics Page
* **Detailed Table**: Subject, Conducted, Attended, Missed, OD, Cancelled, Current %, Target %, "Safely Miss X More" or "Must Attend Y Consecutive".
* **Progress Graphs**: Custom CSS SVG Circular Progress meters showing each course's proximity to target.

### 7. Settings Page
* Target threshold adjustment (default 75%).
* Theme options (Dark / Light / System).
* **Backup/Restore**:
  * Copy-pasteable JSON configuration string.
  * File-based Backup JSON download/upload.
* **CSV Export/Import**: Export attendance records.
* **Reset**: Red-alert factory reset button.

---

## Calculations Formulas

1. **Attendance %**:
   $$\text{Attendance \%} = \left(\frac{\text{Attended} + \text{OD}}{\text{Attended} + \text{Bunked} + \text{OD}}\right) \times 100$$
   *Note: Cancelled classes do not increase conducted classes.*

2. **Above Target (Attendance \% $\ge$ Target \%)**:
   $$\text{Classes you can miss } (X) = \left\lfloor \frac{\text{Attended} + \text{OD}}{\text{Target \%} / 100} - \text{Conducted} \right\rfloor$$

3. **Below Target (Attendance \% $<$ Target \%)**:
   $$\text{Classes you must attend } (Y) = \left\lceil \frac{\text{Conducted} \times (\text{Target \%} / 100) - (\text{Attended} + \text{OD})}{1 - (\text{Target \%} / 100)} \right\rceil$$

---

## Verification Plan

### Automated/Unit Testing via Script
* Run a local verification script to test helper formulas:
  * Attendance percentage calculations.
  * Safe-miss calculations.
  * Must-attend calculations.

### Manual Verification
* Verify dark/light theme switching.
* Add sample subjects and construct a sample timetable.
* Log attendance in the Dashboard, check statistical changes.
* Verify what-if simulation results.
* Check layout responsiveness in mobile views (responsiveness test).
