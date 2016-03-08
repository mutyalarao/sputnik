create edge psrecfield from (select from psrecdefn where recname = );

create edge test3 from (select @rid from psrecdefn where recname='GP_PIN') to (select @rid from psdbfield where fieldname='PIN_TYPE')

select * from (traverse out('pspnlgroup') from pspnlgrpdefn where pnlgrpname='JOB_DATA' while $depth <=3) where $depth=3

select * from (traverse  * from (select * from pspnlgrpdefn where pnlgrpname='JOB_DATA' ) while $depth<=3 STRATEGY BREADTH_FIRST) 