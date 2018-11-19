using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Data.SqlClient;
using System.Drawing;
using System.IO;
using System.Text;
using System.Windows.Forms;
using Oracle.DataAccess.Client;
using System.Data.OleDb;

namespace tmsapp
{
    public partial class Form1 : Form
    {

        String tslot = "";
        String ddate = "";

        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            button1.Enabled = false;
            button4.Enabled = false;
            button6.Enabled = false;
            activity.Text = "";

            ddate = deliverydate.SelectionStart.ToString("yyMMdd");

            if (t10.Checked == true)
                tslot = "T10";
            if (t12.Checked == true)
                tslot = "T12";
            if (t14.Checked == true)
                tslot = "T14";
            if (t16.Checked == true)
                tslot = "T16";
            if (t18.Checked == true)
                tslot = "T18";
            if (t20.Checked == true)
                tslot = "T20";

            if (tslot != "")
            {
                activity.Text += "Date :" + ddate + " ";
                activity.Text += "T Slot :" + tslot + ".....\r\n";

                //glsview/View0nly

                string connectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                            "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                            "Trusted_Connection=no;" +
                                            "database=" + Properties.Settings.Default.instance + "; " +
                                            "connection timeout=10";

                var selectQuery = "select * from Logistics.tmsload where loadid like '" + ddate + tslot + "%' order by loadid;";

                activity.Text += "Exporting load IDs info " + ddate + tslot + "xxxx\r\n";

                string outputfile = "outputfile" + ddate + tslot + "-" + DateTime.Now.ToString("hhmmss") + ".csv";

                using (var conn = new SqlConnection(connectionString))
                using (var command = new SqlCommand("logistics.vehiclecheck", conn)
                {
                    CommandType = CommandType.StoredProcedure
                })
                {
                    try
                    {
                        conn.Open();
                        command.ExecuteNonQuery();
                        conn.Dispose();
                    }
                    catch (SqlException sqle)
                    {
                        activity.Text += "Error connecting to SQL DB :" + sqle.Message + "\r\n";
                    }
                }

                var table = ReadTable(connectionString, selectQuery);
     

                if (table.Rows.Count > 1)
                {
                    activity.Text += "Total : " + table.Rows.Count + " record(s)...\r\n";

                 //   activity.Text += "Start writing...\r\n";
                 //    WriteToFile(table, @"C:\temp\" + outputfile, false, ",");
                 //    activity.Text += "Done writing...C:\\temp\\" + outputfile + "\r\n";
                    table.Dispose();

                    SqlConnection connection2 = new SqlConnection(connectionString);
                    SqlDataAdapter dataadapter = new SqlDataAdapter(selectQuery, connection2);
                    DataSet ds = new DataSet();
                    connection2.Open();
                    dataadapter.Fill(ds,"LoadInfo");
                    connection2.Close();
                    dataGridView1.DataSource = ds;
                    dataGridView1.DataMember = "LoadInfo";
                }
                else
                    activity.Text += "No record found for " + ddate + tslot + "xxxx\r\n";
            }
            else
                activity.Text += "Error : Please select a TSLOT\r\n";

            button1.Enabled = true;
            button4.Enabled = true;
            button6.Enabled = true;
        }

        public static DataTable ReadTable(string connectionString, string selectQuery)
        {
            var returnValue = new DataTable();

            var conn = new SqlConnection(connectionString);

            try
            {
                conn.Open();
                var command = new SqlCommand(selectQuery, conn);

                using (var adapter = new SqlDataAdapter(command))
                {
                    adapter.Fill(returnValue);
                }

            }
            catch (SqlException ex)
            {
              throw ex;
            }
            finally
            {
                if (conn.State == ConnectionState.Open)
                    conn.Close();
            }

            return returnValue;
        }

        public static void WriteToFile(DataTable dataSource, string fileOutputPath, bool firstRowIsColumnHeader = false, string seperator = ";")
        {
            var sw = new StreamWriter(fileOutputPath, false);

            int icolcount = dataSource.Columns.Count;
            string data;

            if (!firstRowIsColumnHeader)
            {
                for (int i = 0; i < icolcount; i++)
                {/*
                    if(i==2)
                    {
                        string x = dataSource.Columns[i].ToString();
                        if (Char.IsLetter(x[0]) && char.IsLetter(x[1]))
                        {
                            data = dataSource.Columns[i].ToString();
                        }
                        else
                            data = "*" + dataSource.Columns[i].ToString();
                    }
                    else
                        data = dataSource.Columns[i].ToString();
                        */
                data = dataSource.Columns[i].ToString();
                    sw.Write(data);
                    if (i < icolcount - 1)
                        sw.Write(seperator);
                }

                sw.Write(sw.NewLine);
            }

            foreach (DataRow drow in dataSource.Rows)
            {
                for (int i = 0; i < icolcount; i++)
                {
                    if (!Convert.IsDBNull(drow[i]))
                        sw.Write(drow[i].ToString());
                    if (i < icolcount - 1)
                        sw.Write(seperator);
                }
                sw.Write(sw.NewLine);
            }
            sw.Close();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            button1.Visible = false;
            button4.Visible = false;
            button6.Visible = false;
            uploadsave.Enabled = false;
            extactwm.Enabled = false;
            dataGridView1.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.AllCells;


            string connectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                 "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                 "Trusted_Connection=no;" +
                                 "database=" + Properties.Settings.Default.instance + "; " +
                                 "connection timeout=10";


            var selectQuery3 = "select distinct usergroup from Logistics.DeliveryMaster where vehicleid is not null and usergroup is not null order by usergroup";

            var table2 = ReadTable(connectionString, selectQuery3);


            if (table2.Rows.Count > 0)
            {
                foreach (DataRow drow in table2.Rows)
                {
                    toolStripComboBox1.Items.Add(drow[0].ToString());
                    toolStripComboBox2.Items.Add(drow[0].ToString());
                }
            }

        }

        private void button2_Click(object sender, EventArgs e)
        {
            activity.Text = "";
            dataGridView1.DataSource = null;
            dataGridView1.Refresh();
        }

        private void label3_Click(object sender, EventArgs e)
        {

        }

        private void extactwm_Click(object sender, EventArgs e)
        {
            OracleConnection conn = new OracleConnection(Properties.Settings.Default.wm6);

                        OracleCommand cmd = new OracleCommand();
                        cmd.Connection = conn;
                        cmd.CommandText = "select 1 from dual";
                        cmd.CommandType = CommandType.Text;
                        conn.Open();
                        OracleDataReader dr = cmd.ExecuteReader();
                        dr.Read();
                        conn.Dispose();

            conn.Dispose();     
        }

        private void button4_Click(object sender, EventArgs e)
        {


            button1.Enabled = false;
            button4.Enabled = false;
            button6.Enabled = false;
            activity.Text = "";

            activity.Text += "Exporting incremental data....\r\n";


            ddate = deliverydate.SelectionStart.ToString("yyMMdd");

            if (t10.Checked == true)
                tslot = "T10";
            if (t12.Checked == true)
                tslot = "T12";
            if (t14.Checked == true)
                tslot = "T14";
            if (t16.Checked == true)
                tslot = "T16";
            if (t18.Checked == true)
                tslot = "T18";
            if (t20.Checked == true)
                tslot = "T20";

            if (tslot != "")
            {
                activity.Text += "Date :" + ddate + " ";
                activity.Text += "T Slot :" + tslot + ".....\r\n";

                //glsview;View0nly
  
                string connectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                     "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                     "Trusted_Connection=no;" +
                                     "database=" + Properties.Settings.Default.instance + "; " +
                                     "connection timeout=10";


                using (var conn = new SqlConnection(connectionString))
                using (var command = new SqlCommand("logistics.vehiclecheck", conn)
                {
                    CommandType = CommandType.StoredProcedure
                })
                {
                    conn.Open();
                    command.ExecuteNonQuery();
                    conn.Dispose();
                }


                var selectQuery = "select * from Logistics.tmsload where loadid like '" + ddate + tslot + "%' order by loadid;";

                activity.Text += "Exporting load IDs info " + ddate + tslot + "xxxx\r\n";

                string outputfile = "outputfile" + ddate + tslot + "-" + DateTime.Now.ToString("hhmmss") + "addon.csv";


                var table = ReadTable(connectionString, selectQuery);

                string orders = "(";
                string orders2 = "(";

                if (table.Rows.Count > 1)
                {
                    foreach (DataRow drow in table.Rows)
                    {
                        orders += "'" + drow[1].ToString() + "',";
                    }
                    orders += "'')";

                    try
                    {
                        OracleConnection conn = new OracleConnection(Properties.Settings.Default.wm6);

                        OracleCommand cmd = new OracleCommand();
                        cmd.Connection = conn;
                        cmd.CommandText = "select stop_sequence from order_header where load_id is not null and stop_sequence in " + orders;
                        cmd.CommandType = CommandType.Text;
                        conn.Open();

                        OracleDataReader dr = cmd.ExecuteReader();

                        while (dr.Read())
                        {
                            orders2 += "'" + dr.GetValue(0) + "',";
                        }
                        orders2 += "'')";
                        dr.Close();
                        conn.Dispose();
                    }
                    catch (Exception ex)
                    {
                        activity.Text += ex.Message + "\r\n";
                        activity.Text += ex.InnerException + "\r\n";
                    }

                    var selectQuery3 = "select * from Logistics.tmsload where orderid not in " + orders2 + " and loadid like '" + ddate + tslot + "%' order by loadid;";

                    var table2 = ReadTable(connectionString, selectQuery3);

            
                    if (table2.Rows.Count > 0)
                    {
                        /*
                        activity.Text += "Start writing...\r\n";
                        WriteToFile(table2, @"C:\temp\" + outputfile, false, ",");
                        activity.Text += "Done writing...C:\\temp\\" + outputfile + "\r\n";
                        table2.Dispose();
                        */
                        table2.Dispose();

                        SqlConnection connection2 = new SqlConnection(connectionString);
                        SqlDataAdapter dataadapter = new SqlDataAdapter(selectQuery3, connection2);
                        DataSet ds = new DataSet();
                        connection2.Open();
                        dataadapter.Fill(ds, "LoadInfo");
                        connection2.Close();
                        dataGridView1.DataSource = ds;
                        dataGridView1.DataMember = "LoadInfo";

                    }
                    else
                        activity.Text += "No new record found for " + ddate + tslot + "xxxx\r\n";
                    
                }
                else
                    activity.Text += "No record found for " + ddate + tslot + "xxxx\r\n";
            }
            else
                activity.Text += "Error : Please select a TSLOT\r\n";

            button1.Enabled = true;
            button4.Enabled = true;
            button6.Enabled = true;
        }

        private void tabPage1_Click(object sender, EventArgs e)
        {

        }

        private void button5_Click(object sender, EventArgs e)
        {

            string outputfile = "outputfile" + ddate + tslot + "-" + DateTime.Now.ToString("hhmmss") + ".csv";

            DataSet ds = new DataSet();
            DataTable dt = new DataTable();
            dt.TableName = "MyTable";
            foreach (DataGridViewColumn col in dataGridView1.Columns)
            {
                dt.Columns.Add(col.DataPropertyName, col.ValueType);
            }
            foreach (DataGridViewRow gridRow in dataGridView1.Rows)
            {
                if (gridRow.IsNewRow)
                    continue;
                DataRow dtRow = dt.NewRow();
                for (int i1 = 0; i1 < dataGridView1.Columns.Count; i1++)
                    dtRow[i1] = (gridRow.Cells[i1].Value == null ? DBNull.Value : gridRow.Cells[i1].Value);
                dt.Rows.Add(dtRow);
            }
            ds.Tables.Add(dt);

            activity.Text += "Start writing...\r\n";
            WriteToFile(dt, @"C:\temp\" + outputfile, false, ",");
            activity.Text += "Done writing...C:\\temp\\" + outputfile + "\r\n";
        }

        private void button6_Click(object sender, EventArgs e)
        {
            button1.Enabled = false;
            button4.Enabled = false;
            button6.Enabled = false;
            activity.Text = "";

            ddate = deliverydate.SelectionStart.ToString("yyMMdd");

            if (t08.Checked == true)
                tslot = "T08";
            if (t10.Checked == true)
                tslot = "T10";
            if (t12.Checked == true)
                tslot = "T12";
            if (t14.Checked == true)
                tslot = "T14";
            if (t16.Checked == true)
                tslot = "T16";
            if (t18.Checked == true)
                tslot = "T18";
            if (t20.Checked == true)
                tslot = "T20";

            if (tslot != "")
            {
                string connectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                "Trusted_Connection=no;" +
                                "database=" + Properties.Settings.Default.instance + "; " +
                                "connection timeout=10";

                var selectQuery = "select distinct loadid,vehicle from Logistics.tmsload where loadid like '" + ddate + tslot + "%' order by vehicle;";
                var table = ReadTable(connectionString, selectQuery);

                if (table.Rows.Count > 1)
                {   
                    //   activity.Text += "Start writing...\r\n";
                    //    WriteToFile(table, @"C:\temp\" + outputfile, false, ",");
                    //    activity.Text += "Done writing...C:\\temp\\" + outputfile + "\r\n";
                    table.Dispose();

                    SqlConnection connection2 = new SqlConnection(connectionString);
                    SqlDataAdapter dataadapter = new SqlDataAdapter(selectQuery, connection2);
                    DataSet ds = new DataSet();
                    connection2.Open();
                    dataadapter.Fill(ds, "VehicleInUse");
                    connection2.Close();
                    dataGridView1.DataSource = ds;
                    dataGridView1.DataMember = "VehicleInUse";
                    activity.Text += "Van in use for " + ddate + " " + tslot + " listed...\r\n";
                    activity.Text += "Total : " + table.Rows.Count + " record(s)...\r\n";
                }
                else
                    activity.Text += "No vehicle record found for " + ddate + tslot + "xxxx\r\n";

            }
            else
                activity.Text += "Error : Please select a TSLOT\r\n";

            button1.Enabled = true;
            button4.Enabled = true;
            button6.Enabled = true;
        }

        private void comboBox1_SelectedIndexChanged(object sender, EventArgs e)
        {

        }

        private void button7_Click(object sender, EventArgs e)
        {
            dataGridView1.DataSource = null;
            dataGridView1.Refresh();

            switch (comboBox1.Text)
            {
                case "Full":
                    button7.Enabled = false;
                    fulldownload();
                    button7.Enabled = true;
                    break;
                case "Incremental":
                    button7.Enabled = false;
                    incremental();
                    button7.Enabled = true;
                    break;
                case "Van In Use":
                    button7.Enabled = false;
                    VanInUse();
                    button7.Enabled = true;
                    break;
                case "Load ID Crosscheck":
                    button7.Enabled = false;
                    crosscheck();
                    button7.Enabled = true;
                    break;

            }
        }

        private void fulldownload()
        {
            button1.Enabled = false;
            button4.Enabled = false;
            button6.Enabled = false;
            activity.Text = "";

            ddate = deliverydate.SelectionStart.ToString("yyMMdd");

            if (t08.Checked == true)
                tslot = "T08";
            if (t10.Checked == true)
                tslot = "T10";
            if (t12.Checked == true)
                tslot = "T12";
            if (t14.Checked == true)
                tslot = "T14";
            if (t16.Checked == true)
                tslot = "T16";
            if (t18.Checked == true)
                tslot = "T18";
            if (t20.Checked == true)
                tslot = "T20";

            if (tslot != "")
            {
                activity.Text += "Date :" + ddate + " ";
                activity.Text += "T Slot :" + tslot + ".....\r\n";

                //glsview/View0nly

                string connectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                            "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                            "Trusted_Connection=no;" +
                                            "database=" + Properties.Settings.Default.instance + "; " +
                                            "connection timeout=10";

                var selectQuery = "select * from Logistics.tmsload where loadid like '" + ddate + tslot + "%' order by loadid;";

                activity.Text += "Exporting load IDs info " + ddate + tslot + "xxxx\r\n";

                string outputfile = "outputfile" + ddate + tslot + "-" + DateTime.Now.ToString("hhmmss") + ".csv";

                using (var conn = new SqlConnection(connectionString))
                using (var command = new SqlCommand("logistics.vehiclecheck", conn)
                {
                    CommandType = CommandType.StoredProcedure
                })
                {
                    try {
                        conn.Open();
                        command.ExecuteNonQuery();
                        conn.Dispose();
                    }
                    catch (SqlException sqle)
                    {
                        activity.Text += "Error connecting to SQL DB :" + sqle.Message + "\r\n";

                    }
                }

                var table = ReadTable(connectionString, selectQuery);


                if (table.Rows.Count > 1)
                {
                    activity.Text += "Total : " + table.Rows.Count + " record(s)...\r\n";

                    //   activity.Text += "Start writing...\r\n";
                    //    WriteToFile(table, @"C:\temp\" + outputfile, false, ",");
                    //    activity.Text += "Done writing...C:\\temp\\" + outputfile + "\r\n";
                    table.Dispose();

                    SqlConnection connection2 = new SqlConnection(connectionString);
                    SqlDataAdapter dataadapter = new SqlDataAdapter(selectQuery, connection2);
                    DataSet ds = new DataSet();
                    connection2.Open();
                    dataadapter.Fill(ds, "LoadInfo");
                    connection2.Close();
                    dataGridView1.DataSource = ds;
                    dataGridView1.DataMember = "LoadInfo";
                }
                else
                    activity.Text += "No record found for " + ddate + tslot + "xxxx\r\n";
            }
            else
                activity.Text += "Error : Please select a TSLOT\r\n";

            button1.Enabled = true;
            button4.Enabled = true;
            button6.Enabled = true;
        }

        private void incremental()
        {
            button1.Enabled = false;
            button4.Enabled = false;
            button6.Enabled = false;
            activity.Text = "";

            activity.Text += "Exporting incremental data....\r\n";


            ddate = deliverydate.SelectionStart.ToString("yyMMdd");

            if (t08.Checked == true)
                tslot = "T08";
            if (t10.Checked == true)
                tslot = "T10";
            if (t12.Checked == true)
                tslot = "T12";
            if (t14.Checked == true)
                tslot = "T14";
            if (t16.Checked == true)
                tslot = "T16";
            if (t18.Checked == true)
                tslot = "T18";
            if (t20.Checked == true)
                tslot = "T20";

            if (tslot != "")
            {
                activity.Text += "Date :" + ddate + " ";
                activity.Text += "T Slot :" + tslot + ".....\r\n";

                //glsview;View0nly

                string connectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                     "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                     "Trusted_Connection=no;" +
                                     "database=" + Properties.Settings.Default.instance + "; " +
                                     "connection timeout=10";


                using (var conn = new SqlConnection(connectionString))
                using (var command = new SqlCommand("logistics.vehiclecheck", conn)
                {
                    CommandType = CommandType.StoredProcedure
                })
                {
                    try
                    {
                        conn.Open();
                        command.ExecuteNonQuery();
                        conn.Dispose();
                    }
                    catch (SqlException sqle)
                    {
                        activity.Text += "Error connecting to SQL DB :" + sqle.Message + "\r\n";
                    }
                    }


                var selectQuery = "select * from Logistics.tmsload where loadid like '" + ddate + tslot + "%' order by loadid;";

                activity.Text += "Exporting load IDs info " + ddate + tslot + "xxxx\r\n";

                string outputfile = "outputfile" + ddate + tslot + "-" + DateTime.Now.ToString("hhmmss") + "addon.csv";


                var table = ReadTable(connectionString, selectQuery);

                string orders = "(";
                string orders2 = "(";

                if (table.Rows.Count > 1)
                {
                    foreach (DataRow drow in table.Rows)
                    {
                        orders += "'" + drow[1].ToString() + "',";
                    }
                    orders += "'')";

                    try
                    {
                        
                        OracleConnection conn = new OracleConnection(Properties.Settings.Default.wm6);

                        OracleCommand cmd = new OracleCommand();
                        cmd.Connection = conn;
                        cmd.CommandText = "select stop_sequence from order_header where load_id is not null and stop_sequence in " + orders;
                        cmd.CommandType = CommandType.Text;
                        conn.Open();
                       
                        OracleDataReader dr = cmd.ExecuteReader();
                        activity.Text += "Reading WM6 Data\r\n";
                        
                       while (dr.Read())
                       {
                           orders2 += "'" + dr.GetValue(0) + "',";
                       }
                       orders2 += "'')";
                       dr.Close();
                       
                       conn.Dispose();
                       activity.Text += "Done reading WM6 Data\r\n";
                   }
                   catch (Exception ex)
                   {
                       activity.Text += ex.Message + "\r\n";
                       activity.Text += ex.InnerException + "\r\n";
                   }

                  var selectQuery3 = "select * from Logistics.tmsload where orderid not in " + orders2 + " and loadid like '" + ddate + tslot + "%' order by loadid;";

                  //  var selectQuery3 = "select * from Logistics.tmsload where loadid like '" + ddate + tslot + "%' order by loadid;";

                    var table2 = ReadTable(connectionString, selectQuery3);


                   if (table2.Rows.Count > 0)
                   {
                       /*
                       activity.Text += "Start writing...\r\n";
                       WriteToFile(table2, @"C:\temp\" + outputfile, false, ",");
                       activity.Text += "Done writing...C:\\temp\\" + outputfile + "\r\n";
                       table2.Dispose();*/

                        table2.Dispose();

                        SqlConnection connection2 = new SqlConnection(connectionString);
                        SqlDataAdapter dataadapter = new SqlDataAdapter(selectQuery3, connection2);
                        DataSet ds = new DataSet();
                        connection2.Open();
                        dataadapter.Fill(ds, "LoadInfo");
                        connection2.Close();
                        dataGridView1.DataSource = ds;
                        dataGridView1.DataMember = "LoadInfo";
                    }
                    else
                        activity.Text += "No new record found for " + ddate + tslot + "xxxx\r\n";

                }
                else
                    activity.Text += "No record found for " + ddate + tslot + "xxxx\r\n";
            }
            else
                activity.Text += "Error : Please select a TSLOT\r\n";

            button1.Enabled = true;
            button4.Enabled = true;
            button6.Enabled = true;
        }

        private void VanInUse()
        {
            button1.Enabled = false;
            button4.Enabled = false;
            button6.Enabled = false;
            activity.Text = "";

            ddate = deliverydate.SelectionStart.ToString("yyMMdd");

            if (t10.Checked == true)
                tslot = "T10";
            if (t12.Checked == true)
                tslot = "T12";
            if (t14.Checked == true)
                tslot = "T14";
            if (t16.Checked == true)
                tslot = "T16";
            if (t18.Checked == true)
                tslot = "T18";
            if (t20.Checked == true)
                tslot = "T20";

            if (tslot != "")
            {
                string connectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                "Trusted_Connection=no;" +
                                "database=" + Properties.Settings.Default.instance + "; " +
                                "connection timeout=10";

                var selectQuery = "select distinct loadid,vehicle from Logistics.tmsload where loadid like '" + ddate + tslot + "%' order by vehicle;";
                var table = ReadTable(connectionString, selectQuery);

                if (table.Rows.Count > 1)
                {
                    //   activity.Text += "Start writing...\r\n";
                    //    WriteToFile(table, @"C:\temp\" + outputfile, false, ",");
                    //    activity.Text += "Done writing...C:\\temp\\" + outputfile + "\r\n";
                    table.Dispose();

                    SqlConnection connection2 = new SqlConnection(connectionString);
                    SqlDataAdapter dataadapter = new SqlDataAdapter(selectQuery, connection2);
                    DataSet ds = new DataSet();
                    connection2.Open();
                    dataadapter.Fill(ds, "VehicleInUse");
                    connection2.Close();
                    dataGridView1.DataSource = ds;
                    dataGridView1.DataMember = "VehicleInUse";
                    activity.Text += "Van in use for " + ddate + " " + tslot + " listed...\r\n";
                    activity.Text += "Total : " + table.Rows.Count + " record(s)...\r\n";
                }
                else
                    activity.Text += "No vehicle record found for " + ddate + tslot + "xxxx\r\n";

            }
            else
                activity.Text += "Error : Please select a TSLOT\r\n";

            button1.Enabled = true;
            button4.Enabled = true;
            button6.Enabled = true;
        }

        public void crosscheck()
        {

            activity.Text = "";

            activity.Text += "Exporting Manual Load ID crossheck....\r\n";

            ddate = deliverydate.SelectionStart.ToString("yyMMdd");

            if (t10.Checked == true)
                tslot = "T10";
            if (t12.Checked == true)
                tslot = "T12";
            if (t14.Checked == true)
                tslot = "T14";
            if (t16.Checked == true)
                tslot = "T16";
            if (t18.Checked == true)
                tslot = "T18";
            if (t20.Checked == true)
                tslot = "T20";

            if (tslot != "")
            {
                activity.Text += "Date :" + ddate + " ";
                activity.Text += "T Slot :" + tslot + ".....\r\n";

                //glsview;View0nly

                string tmsconnectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                     "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                     "Trusted_Connection=no;" +
                                     "database=" + Properties.Settings.Default.instance + "; " +
                                     "connection timeout=10";


                var selectQuery = "select * from Logistics.tmsload where loadid like '" + ddate + tslot + "%' order by loadid;";

                string outputfile = "outputfile" + ddate + tslot + "-" + DateTime.Now.ToString("hhmmss") + "crosscheck.csv";

                try {
                    var table = ReadTable(tmsconnectionString, selectQuery);

                    string orders = "";

                    if (table.Rows.Count > 1)
                    {

                        foreach (DataRow drow in table.Rows)
                        {
                            orders += "'" + drow[1].ToString() + "',";
                        }
                        orders += "'')";

                        try
                        {
                            OracleConnection conn = new OracleConnection(Properties.Settings.Default.wm6);

                            OracleCommand cmd = new OracleCommand();
                            cmd.Connection = conn;
                            cmd.CommandText = "select stop_sequence,load_id from order_header where load_id like '%A%' and stop_sequence in (" + orders;
                            cmd.CommandType = CommandType.Text;
                            conn.Open();

                            var dataReader = cmd.ExecuteReader();
                            var dataTable = new DataTable();
                            var finaltable = new DataTable();

                            finaltable.Columns.Add("Order", typeof(String));
                            finaltable.Columns.Add("Vehicle", typeof(String));
                            finaltable.Columns.Add("TMS LoadID", typeof(String));
                            finaltable.Columns.Add("WM6 LoadID", typeof(String));

                            dataTable.Load(dataReader);

                            foreach (DataRow drow in table.Rows)
                            {
                                foreach (DataRow drow2 in dataTable.Rows)
                                {
                                    if (drow[1].ToString() == drow2[0].ToString())
                                    {
                                        DataRow newRow = finaltable.NewRow();

                                        newRow["Order"] = drow[1].ToString();
                                        newRow["Vehicle"] = drow[2].ToString();
                                        newRow["TMS LoadID"] = drow[0].ToString();
                                        newRow["WM6 LoadID"] = drow2[1].ToString();
                                        finaltable.Rows.Add(newRow);
                                    }
                                }
                            }
                            dataGridView1.DataSource = finaltable;
                            activity.Text += "Total : " + finaltable.Rows.Count + " record(s)...\r\n";
                            dataReader.Close();
                            conn.Dispose();
                        }
                        catch (Exception ex)
                        {
                            activity.Text += ex.Message + "\r\n";
                            activity.Text += ex.InnerException + "\r\n";
                        }
                    }
                    else
                        activity.Text += "No record found for " + ddate + tslot + "xxxx\r\n";
                }
                catch (SqlException sqle)
                {
                    activity.Text += "Error connecting to SQL DB :" + sqle.Message + "\r\n";
                }
            }
            else
                activity.Text += "Error : Please select a TSLOT\r\n";
        }

        private void openFileDialog2_FileOk(object sender, CancelEventArgs e)
        {

        }

        private void tabPage3_Click(object sender, EventArgs e)
        {

        }

        private void button10_Click(object sender, EventArgs e)
        {
            OpenFileDialog dialog = new OpenFileDialog();
            button8.Enabled = true;
            button9.Visible = false;
            activity3.Text = "";
            this.dataGridView1.DataSource = null;
            this.dataGridView1.Rows.Clear();

            dialog.Filter = "Excel Files (*.xls, *.xlsx)|*.xls;*.xlsx"; // file types, that will be allowed to upload
            dialog.Multiselect = false; // allow/deny user to upload more than one file at a time
            if (dialog.ShowDialog() == DialogResult.OK) // if user clicked OK
            {
                String path = dialog.FileName; // get name of file
                uploadfile.Text = path;
            }
        }

        private void button8_Click(object sender, EventArgs e)
        {
            button8.Enabled = false;
            switch (comboBox2.Text)
            {
                case "Select mapper":
                    activity3.Text = "Error : Please select a mapper !";
                    break;
                default:
                    try
                {
                    if (uploadfile.Text == "") activity3.AppendText("No file selected !\r\n");
                    else
                    {
                        activity3.AppendText("Opening " + uploadfile.Text + "\r\n");
                        DataTable maindt = ExcelToDataTable((uploadfile.Text.Replace("\\", "\\\\")), "Sheet1");
                        activity3.AppendText("OK\r\n");
                        uploadorder(maindt);
                    }
                    button8.Enabled = true;

                }
                catch (Exception ex)
                {
                    activity3.AppendText("Error: Could not read file from disk. Original error: " + ex.Message + "\r\n");
                }
                    break;

            }
        }

        private void uploadorder(DataTable tt)
        {
            activity3.AppendText("In uploadorder fn \r\n");
            string connectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                           "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                           "Trusted_Connection=no;" +
                                           "database=" + Properties.Settings.Default.instance + "; " +
                                           "connection timeout=10";

            String orders = "(";

            foreach (DataRow ord in tt.Rows)
            {
                orders += "'" + ord[0].ToString() + "',";
            }
            orders += "'0')";

            List<string> driverslist = new List<string>();

            foreach (DataRow ord in tt.Rows)
            {
                if (!driverslist.Contains(ord[1].ToString()))
                    driverslist.Add(ord[1].ToString() );
            }


            String drivers = "(";
            foreach(String driver in driverslist)
            {
                 drivers += "'" + driver + "'," ;
            }
            drivers += "'')";

            var selectQuery4 = "select id,vehicleid from Logistics.deliverymaster where id in (select deliverymasterid from logistics.deliverydetail  where status = '1' and deliverymasterid in " + orders + ") and id in " + orders;

            var selectQuery5 = "";
            //activity3.AppendText("checking combo box value which is" + comboBox2.Text + "\r\n");
            switch (comboBox2.Text)
            {
                case "ByDriverUserID":
                    selectQuery5 = "select driverusername from Logistics.Vehicle where driverusername in " + drivers;
                    activity3.AppendText("Driver ID mode " + selectQuery5 + "\r\n");
                    break;
                case "ByVehicleID":
                    selectQuery5 = "select id from Logistics.Vehicle where id in " + drivers;
                    activity3.AppendText("Vehicle ID mode " + selectQuery5 + "\r\n");
                    break;
            }

                    

            try
            {

                activity3.AppendText("Extracting TMS Order info\r\n");
                var table3 = ReadTable(connectionString, selectQuery4);
                activity3.AppendText("Extracting TMS Driver info\r\n");
                var table4 = ReadTable(connectionString, selectQuery5);

                tt.Columns.Add("Current", typeof(String));

                if (table3.Rows.Count > 0)
                {
                 //   activity3.AppendText("Has record ! \r\n");
                    foreach (DataRow excelrow in tt.Rows)
                    {
                        foreach (DataRow sqlrow in table3.Rows)
                        {
                            if (excelrow[0].ToString() == sqlrow[0].ToString())
                            {
                       //       activity3.AppendText("Found Matching record \r\n");
                                excelrow[2] = sqlrow[1].ToString();
                                break;
                            }
                            excelrow[2] ="Error : Order status not NEW ";
                            button9.Visible = true;
                            uploadsave.Enabled = false;
                        }
                    }

                    foreach (DataRow excelrow in tt.Rows)
                    {
                        foreach (DataRow sqlrow2 in table4.Rows)
                        {
                            if (excelrow[1].ToString() == sqlrow2[0].ToString())
                            {
                                break;
                            }
                        //    excelrow[2] = "Error : Unable to match driver username";
                            button9.Visible = true;
                            uploadsave.Enabled = false;
                        }
                    }
                    //       activity3.AppendText("updating grid\r\n");
                    dataGridView1.DataSource = tt;
                    this.dataGridView1.Sort(this.dataGridView1.Columns[2], ListSortDirection.Descending);
                    uploadsave.Enabled = true;
                }
                else
                    activity3.AppendText("No matching record to update!\r\n");           
              }
            catch (SqlException e1)
            {
                activity3.AppendText("SQL Error ! :" + e1.Message + "\r\n");
            }
}


        public static DataTable ExcelToDataTable(string pathName, string sheetName)
        {
            DataTable tbContainer = new DataTable();
            string strConn = string.Empty;
            if (string.IsNullOrEmpty(sheetName)) { sheetName = "Sheet1"; }
            FileInfo file = new FileInfo(pathName);
            if (!file.Exists) { throw new Exception("Error, file doesn't exists!"); }
            string extension = file.Extension;
            switch (extension)
            {
                case ".xls":
                    strConn = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + pathName + ";Extended Properties='Excel 8.0;HDR=Yes;IMEX=1;'";
                    break;
                case ".xlsx":
                    strConn = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" + pathName + ";Extended Properties='Excel 12.0;HDR=Yes;IMEX=1;'";
                    break;
                default:
                    strConn = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + pathName + ";Extended Properties='Excel 8.0;HDR=Yes;IMEX=1;'";
                    break;
            }
            OleDbConnection cnnxls = new OleDbConnection(strConn);
            OleDbDataAdapter oda = new OleDbDataAdapter(string.Format("select * from [{0}$]", sheetName), cnnxls);
            DataSet ds = new DataSet();
            oda.Fill(tbContainer);
            return tbContainer;
        }

        private void uploadsave_Click(object sender, EventArgs e)
        {

            DataTable dt = new DataTable();
            dt.TableName = "MyTable";
            foreach (DataGridViewColumn col in dataGridView1.Columns)
            {
                dt.Columns.Add(col.DataPropertyName, col.ValueType);
            }
            foreach (DataGridViewRow gridRow in dataGridView1.Rows)
            {
                if (gridRow.IsNewRow)
                    continue;
                DataRow dtRow = dt.NewRow();
                for (int i1 = 0; i1 < dataGridView1.Columns.Count; i1++)
                    dtRow[i1] = (gridRow.Cells[i1].Value == null ? DBNull.Value : gridRow.Cells[i1].Value);
                dt.Rows.Add(dtRow);
            }


            string tmsconnectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                 "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                 "Trusted_Connection=no;" +
                                 "database=" + Properties.Settings.Default.instance + "; " +
                                 "connection timeout=10";

     
            SqlConnection conn = new SqlConnection(tmsconnectionString);

            foreach (DataRow updaterow in dt.Rows)
            {
                string updatesql = "";
                try
                {

                   // activity3.AppendText("In new order " + updaterow[0].ToString() + " with old vehicle = " + updaterow[2].ToString() + " and new vehicle " + updaterow[1].ToString() + "\r\n");
    
                    switch (comboBox2.Text)
                    {
                        case "ByDriverUserID":
                            updatesql = "update Logistics.DeliveryMaster set VehicleId = ";
                            updatesql += "(select id from Logistics.Vehicle where DriverUsername = '" + updaterow[1].ToString() + "')";
                            updatesql += "where exists (select 1 from logistics.vehicle where DriverUsername = '" + updaterow[1].ToString() + "') and  id in ";
                            updatesql += "(select deliverymasterid from Logistics.DeliveryDetail where status = '1') and id = '" + updaterow[0].ToString() + "' and vehicleid = '" + updaterow[2].ToString() + "'";
                            break;
                        case "ByVehicleID":
                            updatesql = "update Logistics.DeliveryMaster set VehicleId = '";
                            updatesql += updaterow[1].ToString() + "' ";
                            updatesql += "where exists (select 1 from Logistics.Vehicle where id = '" + updaterow[1].ToString() + "')";
                            updatesql += "and id = '" + updaterow[0].ToString() + "'";
                            break;
                    }

                    SqlCommand cmd = new SqlCommand(updatesql, conn);
                    conn.Open();
                   // activity3.AppendText("Executing update :" + updatesql + "\r\n");
                    try
                    {
                        cmd.ExecuteNonQuery();
                    }
                    catch (SqlException e2)
                    {
                        activity3.AppendText("Update error : " + e2.Message + "\r\n");
                    }
                    conn.Close();

                    activity3.AppendText("done for order " + updaterow[0].ToString());
                }
                catch (System.ArgumentOutOfRangeException ee) { }
            }
        }

        private void button9_Click(object sender, EventArgs e)
        {

            DataTable dt = new DataTable();
            dt.TableName = "MyTable";
            foreach (DataGridViewColumn col in dataGridView1.Columns)
            {
                dt.Columns.Add(col.DataPropertyName, col.ValueType);
            }
            foreach (DataGridViewRow gridRow in dataGridView1.Rows)
            {
                if (gridRow.IsNewRow)
                    continue;
                DataRow dtRow = dt.NewRow();
                for (int i1 = 0; i1 < dataGridView1.Columns.Count; i1++)
                    dtRow[i1] = (gridRow.Cells[i1].Value == null ? DBNull.Value : gridRow.Cells[i1].Value);
                dt.Rows.Add(dtRow);
            }

            dt.AcceptChanges();
            foreach (DataRow row in dt.Rows)
            {
                if (row[2].ToString().Substring(1, 5) == "Error") { }
                row.Delete();
            }
            dt.AcceptChanges();
            dataGridView1.DataSource = dt;
        }

        private void teamAWave1ToolStripMenuItem_Click(object sender, EventArgs e)
        {
            /*
            DialogResult result2 = MessageBox.Show("Confirm unassign for next day 12PM-2PM Team A orders?",
    "Warning ! Read before proceed. ",
    MessageBoxButtons.YesNo,
    MessageBoxIcon.Question);

            string tmsconnectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                 "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                 "Trusted_Connection=no;" +
                                 "database=" + Properties.Settings.Default.instance + "; " +
                                 "connection timeout=10";

           // activity.Text = "Unassign status = " + result2.ToString();

            if (result2.ToString() == "Yes")
            {
                SqlConnection conn = new SqlConnection(tmsconnectionString);

                string updateSQL = "Update Logistics.DeliveryMaster set vehicleid = null where vehicleid like 'A_T2%' and id in   ";
                updateSQL += "(select deliverymasterid from logistics.deliverydetail where status = '1' and StartTimeWindow >= dateadd(hour,12,getdate()) )";

           // activity.Text = updateSQL;

                SqlCommand cmd = new SqlCommand(updateSQL, conn);
                conn.Open();

                try
                {
                  cmd.ExecuteNonQuery();
                    MessageBox.Show("Unassign completed, please verify");
                }
                catch (SqlException e2)
                {
                    activity3.AppendText("Update error : " + e2.Message + "\r\n");
                }
                conn.Close();
            }
            else
            { }
            */
        }

        private void teamAWave2ToolStripMenuItem_Click(object sender, EventArgs e)
        {
            /*
            string tmsconnectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                "Trusted_Connection=no;" +
                                "database=" + Properties.Settings.Default.instance + "; " +
                                "connection timeout=10";

            DialogResult result2 = MessageBox.Show("Confirm unassign for next day 4PM-6PM Team A orders?",
    "Warning ! Read before proceed. ",
    MessageBoxButtons.YesNo,
    MessageBoxIcon.Question);

            if (result2.ToString() == "Yes")
            {
                SqlConnection conn = new SqlConnection(tmsconnectionString);

                string updateSQL = "Update Logistics.DeliveryMaster set vehicleid = null where vehicleid like 'A_T3%' and id in   ";
                updateSQL += "(select deliverymasterid from logistics.deliverydetail where status = '1' and StartTimeWindow >= dateadd(hour,12,getdate()) )";

                SqlCommand cmd = new SqlCommand(updateSQL, conn);
                conn.Open();

                try
                {
                    cmd.ExecuteNonQuery();
                }
                catch (SqlException e2)
                {
                    activity.AppendText("Unassign error : " + e2.Message + "\r\n");
                }
                conn.Close();
            }
            */
        }

        private void toolStripComboBox1_SelectedIndexChanged(object sender, EventArgs e)
        {
            //    MessageBox.Show("Unassign" + toolStripComboBox1.SelectedItem.ToString());
            //toolStripTextBox1.Text = toolStripComboBox1.SelectedItem.ToString();
        }

        private void toolStripTextBox1_Click(object sender, EventArgs e)
        {

            if (toolStripComboBox1.SelectedIndex > -1)
            { 

                DialogResult result2 = MessageBox.Show("Confirm unassign for next day 12PM-2PM Team A orders for " + toolStripComboBox1.SelectedItem.ToString() + " ?",
"Warning ! Read before proceed. ",
MessageBoxButtons.YesNo,
MessageBoxIcon.Question);

                string tmsconnectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                     "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                     "Trusted_Connection=no;" +
                                     "database=" + Properties.Settings.Default.instance + "; " +
                                     "connection timeout=10";

                // activity.Text = "Unassign status = " + result2.ToString();

                if (result2.ToString() == "Yes")
                {
                    SqlConnection conn = new SqlConnection(tmsconnectionString);

                    string updateSQL = "Update Logistics.DeliveryMaster set vehicleid = null where usergroup = '" + toolStripComboBox1.SelectedItem.ToString() + "' and vehicleid like 'A_T2%' and id in   ";
                    updateSQL += "(select deliverymasterid from logistics.deliverydetail where status = '1' and StartTimeWindow >= dateadd(hour,12,getdate()) )";

                    // activity.Text = updateSQL;

                    SqlCommand cmd = new SqlCommand(updateSQL, conn);
                    conn.Open();

                    try
                    {
                        cmd.ExecuteNonQuery();
                        MessageBox.Show("Unassign completed, please verify");
                    }
                    catch (SqlException e2)
                    {
                        activity3.AppendText("Update error : " + e2.Message + "\r\n");
                    }
                    conn.Close();
                }
                else
                {
                    MessageBox.Show("Unassign cancelled");
                }

            }
            else
            {          
             MessageBox.Show("Please select usergroup to unassign"); 
            }
        }

        private void lToolStripMenuItem_Click(object sender, EventArgs e)
        {
            //
        }

        private void unassignToolStripMenuItem_Click(object sender, EventArgs e)
        {

            if (toolStripComboBox2.SelectedIndex > -1)
            { 
                string tmsconnectionString = "user id=" + Properties.Settings.Default.user + ";" +
                                               "password=" + Properties.Settings.Default.pwd + ";server = " + Properties.Settings.Default.db + "; " +
                                               "Trusted_Connection=no;" +
                                               "database=" + Properties.Settings.Default.instance + "; " +
                                               "connection timeout=10";

                DialogResult result2 = MessageBox.Show("Confirm unassign for next day 4PM-6PM Team A orders for " + toolStripComboBox2.SelectedItem.ToString() + " ?",
        "Warning ! Read before proceed. ",
        MessageBoxButtons.YesNo,
        MessageBoxIcon.Question);

                if (result2.ToString() == "Yes")
                {
                    SqlConnection conn = new SqlConnection(tmsconnectionString);

                    string updateSQL = "Update Logistics.DeliveryMaster set vehicleid = null where usergroup = '" + toolStripComboBox2.SelectedItem.ToString() + "' and vehicleid like 'A_T3%' and id in   ";
                    updateSQL += "(select deliverymasterid from logistics.deliverydetail where status = '1' and StartTimeWindow >= dateadd(hour,12,getdate()) )";

                    SqlCommand cmd = new SqlCommand(updateSQL, conn);
                    conn.Open();

                    try
                    {
                        cmd.ExecuteNonQuery();
                        MessageBox.Show("Unassign completed, please verify");
                    }
                    catch (SqlException e2)
                    {
                        activity.AppendText("Unassign error : " + e2.Message + "\r\n");
                    }

                    conn.Close();

                }
                else
                {
                    MessageBox.Show("Unassign cancelled");
                }
            }
            else
            { MessageBox.Show("Please select usergroup to unassign"); }
        }
    }
}
