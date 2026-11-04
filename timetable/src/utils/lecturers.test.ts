import { lecturerFullNames, lecturerInitials, lecturerShort } from './lecturers';

describe('lecturers', () => {
  it('splits initials and drops the faculty prefix', () => {
    expect(lecturerInitials('KT, AB')).toEqual(['KT', 'AB']);
    expect(lecturerInitials('_AL')).toEqual(['AL']);
    expect(lecturerInitials('')).toEqual([]);
  });

  it('shows initials on the timetable', () => {
    expect(lecturerShort('_AL, DC')).toBe('AL, DC');
  });

  it('maps initials to full names and keeps unknown ones', () => {
    expect(lecturerFullNames('KT, AB')).toEqual(['Dr. Kamuran Turkoglu', 'Anastashia Bamiteko']);
    expect(lecturerFullNames('_AL')).toEqual(['Dr. Alla Mostepanuk']);
    expect(lecturerFullNames('NA')).toEqual(['NA']);
  });
});
