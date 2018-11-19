namespace tmsapp
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(Form1));
            this.deliverydate = new System.Windows.Forms.MonthCalendar();
            this.button1 = new System.Windows.Forms.Button();
            this.activity = new System.Windows.Forms.TextBox();
            this.t10 = new System.Windows.Forms.RadioButton();
            this.t12 = new System.Windows.Forms.RadioButton();
            this.t16 = new System.Windows.Forms.RadioButton();
            this.t14 = new System.Windows.Forms.RadioButton();
            this.t20 = new System.Windows.Forms.RadioButton();
            this.t18 = new System.Windows.Forms.RadioButton();
            this.selectslot = new System.Windows.Forms.GroupBox();
            this.t08 = new System.Windows.Forms.RadioButton();
            this.button2 = new System.Windows.Forms.Button();
            this.Tabage = new System.Windows.Forms.TabControl();
            this.tabPage1 = new System.Windows.Forms.TabPage();
            this.button7 = new System.Windows.Forms.Button();
            this.comboBox1 = new System.Windows.Forms.ComboBox();
            this.groupBox2 = new System.Windows.Forms.GroupBox();
            this.button6 = new System.Windows.Forms.Button();
            this.button4 = new System.Windows.Forms.Button();
            this.label3 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.label1 = new System.Windows.Forms.Label();
            this.tabPage2 = new System.Windows.Forms.TabPage();
            this.label4 = new System.Windows.Forms.Label();
            this.label5 = new System.Windows.Forms.Label();
            this.label6 = new System.Windows.Forms.Label();
            this.activity2 = new System.Windows.Forms.TextBox();
            this.button3 = new System.Windows.Forms.Button();
            this.extactwm = new System.Windows.Forms.Button();
            this.wm20 = new System.Windows.Forms.CheckBox();
            this.wm18 = new System.Windows.Forms.CheckBox();
            this.wm16 = new System.Windows.Forms.CheckBox();
            this.wm14 = new System.Windows.Forms.CheckBox();
            this.wm12 = new System.Windows.Forms.CheckBox();
            this.wm10 = new System.Windows.Forms.CheckBox();
            this.wmdate = new System.Windows.Forms.MonthCalendar();
            this.tabPage3 = new System.Windows.Forms.TabPage();
            this.comboBox2 = new System.Windows.Forms.ComboBox();
            this.button9 = new System.Windows.Forms.Button();
            this.activity3 = new System.Windows.Forms.TextBox();
            this.label8 = new System.Windows.Forms.Label();
            this.label7 = new System.Windows.Forms.Label();
            this.uploadfile = new System.Windows.Forms.TextBox();
            this.button10 = new System.Windows.Forms.Button();
            this.uploadsave = new System.Windows.Forms.Button();
            this.button8 = new System.Windows.Forms.Button();
            this.backgroundWorker1 = new System.ComponentModel.BackgroundWorker();
            this.dataGridView1 = new System.Windows.Forms.DataGridView();
            this.button5 = new System.Windows.Forms.Button();
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.menuStrip1 = new System.Windows.Forms.MenuStrip();
            this.unassignOrdersToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.teamAWave1ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.toolStripComboBox1 = new System.Windows.Forms.ToolStripComboBox();
            this.toolStripTextBox1 = new System.Windows.Forms.ToolStripTextBox();
            this.teamAWave2ToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.toolStripComboBox2 = new System.Windows.Forms.ToolStripComboBox();
            this.unassignToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.selectslot.SuspendLayout();
            this.Tabage.SuspendLayout();
            this.tabPage1.SuspendLayout();
            this.tabPage2.SuspendLayout();
            this.tabPage3.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.dataGridView1)).BeginInit();
            this.groupBox1.SuspendLayout();
            this.menuStrip1.SuspendLayout();
            this.SuspendLayout();
            // 
            // deliverydate
            // 
            this.deliverydate.Location = new System.Drawing.Point(9, 9);
            this.deliverydate.MaxSelectionCount = 1;
            this.deliverydate.Name = "deliverydate";
            this.deliverydate.TabIndex = 0;
            // 
            // button1
            // 
            this.button1.Location = new System.Drawing.Point(687, 116);
            this.button1.Name = "button1";
            this.button1.Size = new System.Drawing.Size(75, 28);
            this.button1.TabIndex = 7;
            this.button1.Tag = "Extract";
            this.button1.Text = "Full";
            this.button1.UseVisualStyleBackColor = true;
            this.button1.Click += new System.EventHandler(this.button1_Click);
            // 
            // activity
            // 
            this.activity.Location = new System.Drawing.Point(322, 109);
            this.activity.Multiline = true;
            this.activity.Name = "activity";
            this.activity.Size = new System.Drawing.Size(398, 107);
            this.activity.TabIndex = 8;
            // 
            // t10
            // 
            this.t10.AutoSize = true;
            this.t10.Location = new System.Drawing.Point(72, 20);
            this.t10.Name = "t10";
            this.t10.Size = new System.Drawing.Size(54, 21);
            this.t10.TabIndex = 9;
            this.t10.TabStop = true;
            this.t10.Text = "T10";
            this.t10.UseVisualStyleBackColor = true;
            // 
            // t12
            // 
            this.t12.AutoSize = true;
            this.t12.Location = new System.Drawing.Point(130, 21);
            this.t12.Name = "t12";
            this.t12.Size = new System.Drawing.Size(54, 21);
            this.t12.TabIndex = 10;
            this.t12.TabStop = true;
            this.t12.Text = "T12";
            this.t12.UseVisualStyleBackColor = true;
            // 
            // t16
            // 
            this.t16.AutoSize = true;
            this.t16.Location = new System.Drawing.Point(250, 21);
            this.t16.Name = "t16";
            this.t16.Size = new System.Drawing.Size(54, 21);
            this.t16.TabIndex = 12;
            this.t16.TabStop = true;
            this.t16.Text = "T16";
            this.t16.UseVisualStyleBackColor = true;
            // 
            // t14
            // 
            this.t14.AutoSize = true;
            this.t14.Location = new System.Drawing.Point(190, 21);
            this.t14.Name = "t14";
            this.t14.Size = new System.Drawing.Size(54, 21);
            this.t14.TabIndex = 11;
            this.t14.TabStop = true;
            this.t14.Text = "T14";
            this.t14.UseVisualStyleBackColor = true;
            // 
            // t20
            // 
            this.t20.AutoSize = true;
            this.t20.Location = new System.Drawing.Point(370, 21);
            this.t20.Name = "t20";
            this.t20.Size = new System.Drawing.Size(54, 21);
            this.t20.TabIndex = 14;
            this.t20.TabStop = true;
            this.t20.Text = "T20";
            this.t20.UseVisualStyleBackColor = true;
            // 
            // t18
            // 
            this.t18.AutoSize = true;
            this.t18.Location = new System.Drawing.Point(310, 21);
            this.t18.Name = "t18";
            this.t18.Size = new System.Drawing.Size(54, 21);
            this.t18.TabIndex = 13;
            this.t18.TabStop = true;
            this.t18.Text = "T18";
            this.t18.UseVisualStyleBackColor = true;
            // 
            // selectslot
            // 
            this.selectslot.Controls.Add(this.t08);
            this.selectslot.Controls.Add(this.t16);
            this.selectslot.Controls.Add(this.t20);
            this.selectslot.Controls.Add(this.t10);
            this.selectslot.Controls.Add(this.t18);
            this.selectslot.Controls.Add(this.t12);
            this.selectslot.Controls.Add(this.t14);
            this.selectslot.Location = new System.Drawing.Point(322, 13);
            this.selectslot.Name = "selectslot";
            this.selectslot.Size = new System.Drawing.Size(434, 55);
            this.selectslot.TabIndex = 15;
            this.selectslot.TabStop = false;
            this.selectslot.Text = "T-Slot";
            // 
            // t08
            // 
            this.t08.AutoSize = true;
            this.t08.Location = new System.Drawing.Point(12, 20);
            this.t08.Name = "t08";
            this.t08.Size = new System.Drawing.Size(54, 21);
            this.t08.TabIndex = 15;
            this.t08.TabStop = true;
            this.t08.Text = "T08";
            this.t08.UseVisualStyleBackColor = true;
            // 
            // button2
            // 
            this.button2.Location = new System.Drawing.Point(599, 74);
            this.button2.Name = "button2";
            this.button2.Size = new System.Drawing.Size(75, 29);
            this.button2.TabIndex = 16;
            this.button2.Text = "Clear ";
            this.button2.UseVisualStyleBackColor = true;
            this.button2.Click += new System.EventHandler(this.button2_Click);
            // 
            // Tabage
            // 
            this.Tabage.Controls.Add(this.tabPage1);
            this.Tabage.Controls.Add(this.tabPage2);
            this.Tabage.Controls.Add(this.tabPage3);
            this.Tabage.Location = new System.Drawing.Point(21, 32);
            this.Tabage.Name = "Tabage";
            this.Tabage.SelectedIndex = 0;
            this.Tabage.Size = new System.Drawing.Size(770, 260);
            this.Tabage.TabIndex = 17;
            // 
            // tabPage1
            // 
            this.tabPage1.Controls.Add(this.button7);
            this.tabPage1.Controls.Add(this.comboBox1);
            this.tabPage1.Controls.Add(this.groupBox2);
            this.tabPage1.Controls.Add(this.button6);
            this.tabPage1.Controls.Add(this.button4);
            this.tabPage1.Controls.Add(this.label3);
            this.tabPage1.Controls.Add(this.label2);
            this.tabPage1.Controls.Add(this.label1);
            this.tabPage1.Controls.Add(this.deliverydate);
            this.tabPage1.Controls.Add(this.button2);
            this.tabPage1.Controls.Add(this.button1);
            this.tabPage1.Controls.Add(this.selectslot);
            this.tabPage1.Controls.Add(this.activity);
            this.tabPage1.Location = new System.Drawing.Point(4, 25);
            this.tabPage1.Name = "tabPage1";
            this.tabPage1.Padding = new System.Windows.Forms.Padding(3);
            this.tabPage1.Size = new System.Drawing.Size(762, 231);
            this.tabPage1.TabIndex = 0;
            this.tabPage1.Text = "TMS LoadID Export";
            this.tabPage1.UseVisualStyleBackColor = true;
            this.tabPage1.Click += new System.EventHandler(this.tabPage1_Click);
            // 
            // button7
            // 
            this.button7.Location = new System.Drawing.Point(518, 74);
            this.button7.Name = "button7";
            this.button7.Size = new System.Drawing.Size(75, 29);
            this.button7.TabIndex = 23;
            this.button7.Text = "Execute";
            this.button7.UseVisualStyleBackColor = true;
            this.button7.Click += new System.EventHandler(this.button7_Click);
            // 
            // comboBox1
            // 
            this.comboBox1.FormattingEnabled = true;
            this.comboBox1.Items.AddRange(new object[] {
            "Full",
            "Incremental",
            "Van In Use",
            "Load ID Crosscheck"});
            this.comboBox1.Location = new System.Drawing.Point(322, 77);
            this.comboBox1.Name = "comboBox1";
            this.comboBox1.Size = new System.Drawing.Size(176, 24);
            this.comboBox1.TabIndex = 22;
            this.comboBox1.SelectedIndexChanged += new System.EventHandler(this.comboBox1_SelectedIndexChanged);
            // 
            // groupBox2
            // 
            this.groupBox2.Location = new System.Drawing.Point(290, 3);
            this.groupBox2.Name = "groupBox2";
            this.groupBox2.Size = new System.Drawing.Size(16, 213);
            this.groupBox2.TabIndex = 21;
            this.groupBox2.TabStop = false;
            // 
            // button6
            // 
            this.button6.Location = new System.Drawing.Point(692, 116);
            this.button6.Name = "button6";
            this.button6.Size = new System.Drawing.Size(89, 29);
            this.button6.TabIndex = 20;
            this.button6.Text = "Van in Use";
            this.button6.UseVisualStyleBackColor = true;
            this.button6.Click += new System.EventHandler(this.button6_Click);
            // 
            // button4
            // 
            this.button4.Location = new System.Drawing.Point(661, 100);
            this.button4.Name = "button4";
            this.button4.Size = new System.Drawing.Size(95, 29);
            this.button4.TabIndex = 19;
            this.button4.Text = "Incremental ONLY";
            this.button4.UseVisualStyleBackColor = true;
            this.button4.Click += new System.EventHandler(this.button4_Click);
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Font = new System.Drawing.Font("Microsoft Sans Serif", 10.2F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label3.Location = new System.Drawing.Point(328, 49);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(0, 20);
            this.label3.TabIndex = 18;
            this.label3.Click += new System.EventHandler(this.label3_Click);
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Microsoft Sans Serif", 10.2F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label2.Location = new System.Drawing.Point(328, 29);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(0, 20);
            this.label2.TabIndex = 17;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Microsoft Sans Serif", 10.2F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(328, 9);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(0, 20);
            this.label1.TabIndex = 15;
            // 
            // tabPage2
            // 
            this.tabPage2.Controls.Add(this.label4);
            this.tabPage2.Controls.Add(this.label5);
            this.tabPage2.Controls.Add(this.label6);
            this.tabPage2.Controls.Add(this.activity2);
            this.tabPage2.Controls.Add(this.button3);
            this.tabPage2.Controls.Add(this.extactwm);
            this.tabPage2.Controls.Add(this.wm20);
            this.tabPage2.Controls.Add(this.wm18);
            this.tabPage2.Controls.Add(this.wm16);
            this.tabPage2.Controls.Add(this.wm14);
            this.tabPage2.Controls.Add(this.wm12);
            this.tabPage2.Controls.Add(this.wm10);
            this.tabPage2.Controls.Add(this.wmdate);
            this.tabPage2.Location = new System.Drawing.Point(4, 25);
            this.tabPage2.Name = "tabPage2";
            this.tabPage2.Padding = new System.Windows.Forms.Padding(3);
            this.tabPage2.Size = new System.Drawing.Size(762, 231);
            this.tabPage2.TabIndex = 1;
            this.tabPage2.Text = "WM6 Order Export";
            this.tabPage2.UseVisualStyleBackColor = true;
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Font = new System.Drawing.Font("Microsoft Sans Serif", 10.2F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label4.Location = new System.Drawing.Point(310, 52);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(211, 20);
            this.label4.TabIndex = 22;
            this.label4.Text = "Step 3 : Click <Extract>";
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Font = new System.Drawing.Font("Microsoft Sans Serif", 10.2F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label5.Location = new System.Drawing.Point(310, 32);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(213, 20);
            this.label5.TabIndex = 21;
            this.label5.Text = "Step 2 : Select T-slot(s)";
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Font = new System.Drawing.Font("Microsoft Sans Serif", 10.2F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label6.Location = new System.Drawing.Point(310, 12);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(255, 20);
            this.label6.TabIndex = 20;
            this.label6.Text = "Step 1 : Select Delivery Date";
            // 
            // activity2
            // 
            this.activity2.Location = new System.Drawing.Point(9, 298);
            this.activity2.Multiline = true;
            this.activity2.Name = "activity2";
            this.activity2.Size = new System.Drawing.Size(450, 147);
            this.activity2.TabIndex = 19;
            // 
            // button3
            // 
            this.button3.Location = new System.Drawing.Point(90, 260);
            this.button3.Name = "button3";
            this.button3.Size = new System.Drawing.Size(75, 23);
            this.button3.TabIndex = 18;
            this.button3.Text = "Clear ";
            this.button3.UseVisualStyleBackColor = true;
            // 
            // extactwm
            // 
            this.extactwm.Location = new System.Drawing.Point(9, 260);
            this.extactwm.Name = "extactwm";
            this.extactwm.Size = new System.Drawing.Size(75, 23);
            this.extactwm.TabIndex = 17;
            this.extactwm.Text = "Extract";
            this.extactwm.UseVisualStyleBackColor = true;
            this.extactwm.Click += new System.EventHandler(this.extactwm_Click);
            // 
            // wm20
            // 
            this.wm20.AutoSize = true;
            this.wm20.Location = new System.Drawing.Point(277, 231);
            this.wm20.Name = "wm20";
            this.wm20.Size = new System.Drawing.Size(55, 21);
            this.wm20.TabIndex = 6;
            this.wm20.Text = "T20";
            this.wm20.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            this.wm20.UseVisualStyleBackColor = true;
            // 
            // wm18
            // 
            this.wm18.AutoSize = true;
            this.wm18.Location = new System.Drawing.Point(226, 231);
            this.wm18.Name = "wm18";
            this.wm18.Size = new System.Drawing.Size(55, 21);
            this.wm18.TabIndex = 5;
            this.wm18.Text = "T18";
            this.wm18.UseVisualStyleBackColor = true;
            // 
            // wm16
            // 
            this.wm16.AutoSize = true;
            this.wm16.Location = new System.Drawing.Point(174, 231);
            this.wm16.Name = "wm16";
            this.wm16.Size = new System.Drawing.Size(55, 21);
            this.wm16.TabIndex = 4;
            this.wm16.Text = "T16";
            this.wm16.UseVisualStyleBackColor = true;
            // 
            // wm14
            // 
            this.wm14.AutoSize = true;
            this.wm14.Location = new System.Drawing.Point(120, 231);
            this.wm14.Name = "wm14";
            this.wm14.Size = new System.Drawing.Size(55, 21);
            this.wm14.TabIndex = 3;
            this.wm14.Text = "T14";
            this.wm14.UseVisualStyleBackColor = true;
            // 
            // wm12
            // 
            this.wm12.AutoSize = true;
            this.wm12.Location = new System.Drawing.Point(66, 231);
            this.wm12.Name = "wm12";
            this.wm12.Size = new System.Drawing.Size(55, 21);
            this.wm12.TabIndex = 2;
            this.wm12.Text = "T12";
            this.wm12.UseVisualStyleBackColor = true;
            // 
            // wm10
            // 
            this.wm10.AutoSize = true;
            this.wm10.Location = new System.Drawing.Point(12, 231);
            this.wm10.Name = "wm10";
            this.wm10.Size = new System.Drawing.Size(55, 21);
            this.wm10.TabIndex = 1;
            this.wm10.Text = "T10";
            this.wm10.UseVisualStyleBackColor = true;
            // 
            // wmdate
            // 
            this.wmdate.Location = new System.Drawing.Point(12, 12);
            this.wmdate.Name = "wmdate";
            this.wmdate.TabIndex = 0;
            // 
            // tabPage3
            // 
            this.tabPage3.Controls.Add(this.comboBox2);
            this.tabPage3.Controls.Add(this.button9);
            this.tabPage3.Controls.Add(this.activity3);
            this.tabPage3.Controls.Add(this.label8);
            this.tabPage3.Controls.Add(this.label7);
            this.tabPage3.Controls.Add(this.uploadfile);
            this.tabPage3.Controls.Add(this.button10);
            this.tabPage3.Controls.Add(this.uploadsave);
            this.tabPage3.Controls.Add(this.button8);
            this.tabPage3.Location = new System.Drawing.Point(4, 25);
            this.tabPage3.Name = "tabPage3";
            this.tabPage3.Padding = new System.Windows.Forms.Padding(3);
            this.tabPage3.Size = new System.Drawing.Size(762, 231);
            this.tabPage3.TabIndex = 2;
            this.tabPage3.Text = "Upload Drivers - Orders";
            this.tabPage3.UseVisualStyleBackColor = true;
            this.tabPage3.Click += new System.EventHandler(this.tabPage3_Click);
            // 
            // comboBox2
            // 
            this.comboBox2.FormattingEnabled = true;
            this.comboBox2.Items.AddRange(new object[] {
            "ByDriverUserID",
            "ByVehicleID"});
            this.comboBox2.Location = new System.Drawing.Point(9, 92);
            this.comboBox2.Name = "comboBox2";
            this.comboBox2.Size = new System.Drawing.Size(121, 24);
            this.comboBox2.TabIndex = 11;
            this.comboBox2.Text = "Select mapper";
            // 
            // button9
            // 
            this.button9.Location = new System.Drawing.Point(296, 91);
            this.button9.Name = "button9";
            this.button9.Size = new System.Drawing.Size(198, 26);
            this.button9.TabIndex = 10;
            this.button9.Text = "Remove invalid records";
            this.button9.UseVisualStyleBackColor = true;
            this.button9.Visible = false;
            this.button9.Click += new System.EventHandler(this.button9_Click);
            // 
            // activity3
            // 
            this.activity3.Location = new System.Drawing.Point(6, 131);
            this.activity3.Multiline = true;
            this.activity3.Name = "activity3";
            this.activity3.Size = new System.Drawing.Size(741, 94);
            this.activity3.TabIndex = 9;
            // 
            // label8
            // 
            this.label8.AutoSize = true;
            this.label8.Location = new System.Drawing.Point(6, 69);
            this.label8.Name = "label8";
            this.label8.Size = new System.Drawing.Size(161, 17);
            this.label8.TabIndex = 5;
            this.label8.Text = "Step 2 : Verify and Save";
            // 
            // label7
            // 
            this.label7.AutoSize = true;
            this.label7.Location = new System.Drawing.Point(3, 10);
            this.label7.Name = "label7";
            this.label7.Size = new System.Drawing.Size(185, 17);
            this.label7.TabIndex = 4;
            this.label7.Text = "Step 1 : Select file to upload";
            // 
            // uploadfile
            // 
            this.uploadfile.Location = new System.Drawing.Point(6, 32);
            this.uploadfile.Name = "uploadfile";
            this.uploadfile.Size = new System.Drawing.Size(372, 22);
            this.uploadfile.TabIndex = 3;
            // 
            // button10
            // 
            this.button10.Location = new System.Drawing.Point(384, 32);
            this.button10.Name = "button10";
            this.button10.Size = new System.Drawing.Size(75, 23);
            this.button10.TabIndex = 2;
            this.button10.Text = "Browse";
            this.button10.UseVisualStyleBackColor = true;
            this.button10.Click += new System.EventHandler(this.button10_Click);
            // 
            // uploadsave
            // 
            this.uploadsave.Location = new System.Drawing.Point(215, 91);
            this.uploadsave.Name = "uploadsave";
            this.uploadsave.Size = new System.Drawing.Size(76, 26);
            this.uploadsave.TabIndex = 1;
            this.uploadsave.Text = "Save";
            this.uploadsave.UseVisualStyleBackColor = true;
            this.uploadsave.Click += new System.EventHandler(this.uploadsave_Click);
            // 
            // button8
            // 
            this.button8.Location = new System.Drawing.Point(134, 91);
            this.button8.Name = "button8";
            this.button8.Size = new System.Drawing.Size(76, 26);
            this.button8.TabIndex = 0;
            this.button8.Text = "Verify";
            this.button8.UseVisualStyleBackColor = true;
            this.button8.Click += new System.EventHandler(this.button8_Click);
            // 
            // dataGridView1
            // 
            this.dataGridView1.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.dataGridView1.Location = new System.Drawing.Point(6, 23);
            this.dataGridView1.Name = "dataGridView1";
            this.dataGridView1.RowTemplate.Height = 24;
            this.dataGridView1.Size = new System.Drawing.Size(745, 394);
            this.dataGridView1.TabIndex = 18;
            // 
            // button5
            // 
            this.button5.Location = new System.Drawing.Point(21, 740);
            this.button5.Name = "button5";
            this.button5.Size = new System.Drawing.Size(75, 23);
            this.button5.TabIndex = 19;
            this.button5.Text = "Extract";
            this.button5.UseVisualStyleBackColor = true;
            this.button5.Click += new System.EventHandler(this.button5_Click);
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.dataGridView1);
            this.groupBox1.Location = new System.Drawing.Point(21, 298);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(770, 442);
            this.groupBox1.TabIndex = 20;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "Preview / Edit";
            // 
            // menuStrip1
            // 
            this.menuStrip1.ImageScalingSize = new System.Drawing.Size(20, 20);
            this.menuStrip1.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.unassignOrdersToolStripMenuItem});
            this.menuStrip1.Location = new System.Drawing.Point(0, 0);
            this.menuStrip1.Name = "menuStrip1";
            this.menuStrip1.Size = new System.Drawing.Size(826, 28);
            this.menuStrip1.TabIndex = 21;
            this.menuStrip1.Text = "menuStrip1";
            // 
            // unassignOrdersToolStripMenuItem
            // 
            this.unassignOrdersToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.teamAWave1ToolStripMenuItem,
            this.teamAWave2ToolStripMenuItem});
            this.unassignOrdersToolStripMenuItem.Name = "unassignOrdersToolStripMenuItem";
            this.unassignOrdersToolStripMenuItem.Size = new System.Drawing.Size(128, 24);
            this.unassignOrdersToolStripMenuItem.Text = "Unassign Orders";
            // 
            // teamAWave1ToolStripMenuItem
            // 
            this.teamAWave1ToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.toolStripComboBox1,
            this.toolStripTextBox1});
            this.teamAWave1ToolStripMenuItem.Name = "teamAWave1ToolStripMenuItem";
            this.teamAWave1ToolStripMenuItem.Size = new System.Drawing.Size(188, 26);
            this.teamAWave1ToolStripMenuItem.Text = "Team A Wave 1";
            this.teamAWave1ToolStripMenuItem.Click += new System.EventHandler(this.teamAWave1ToolStripMenuItem_Click);
            // 
            // toolStripComboBox1
            // 
            this.toolStripComboBox1.Name = "toolStripComboBox1";
            this.toolStripComboBox1.Size = new System.Drawing.Size(121, 28);
            // 
            // toolStripTextBox1
            // 
            this.toolStripTextBox1.Name = "toolStripTextBox1";
            this.toolStripTextBox1.ReadOnly = true;
            this.toolStripTextBox1.Size = new System.Drawing.Size(100, 27);
            this.toolStripTextBox1.Text = "Unassign";
            this.toolStripTextBox1.Click += new System.EventHandler(this.toolStripTextBox1_Click);
            // 
            // teamAWave2ToolStripMenuItem
            // 
            this.teamAWave2ToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.toolStripComboBox2,
            this.unassignToolStripMenuItem});
            this.teamAWave2ToolStripMenuItem.Name = "teamAWave2ToolStripMenuItem";
            this.teamAWave2ToolStripMenuItem.Size = new System.Drawing.Size(188, 26);
            this.teamAWave2ToolStripMenuItem.Text = "Team A Wave 2";
            this.teamAWave2ToolStripMenuItem.Click += new System.EventHandler(this.teamAWave2ToolStripMenuItem_Click);
            // 
            // toolStripComboBox2
            // 
            this.toolStripComboBox2.Name = "toolStripComboBox2";
            this.toolStripComboBox2.Size = new System.Drawing.Size(121, 28);
            // 
            // unassignToolStripMenuItem
            // 
            this.unassignToolStripMenuItem.Name = "unassignToolStripMenuItem";
            this.unassignToolStripMenuItem.Size = new System.Drawing.Size(187, 26);
            this.unassignToolStripMenuItem.Text = "Unassign";
            this.unassignToolStripMenuItem.Click += new System.EventHandler(this.unassignToolStripMenuItem_Click);
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(826, 806);
            this.Controls.Add(this.groupBox1);
            this.Controls.Add(this.button5);
            this.Controls.Add(this.Tabage);
            this.Controls.Add(this.menuStrip1);
            this.Icon = ((System.Drawing.Icon)(resources.GetObject("$this.Icon")));
            this.MainMenuStrip = this.menuStrip1;
            this.Name = "Form1";
            this.Text = "TMS -WM6 Integration";
            this.Load += new System.EventHandler(this.Form1_Load);
            this.selectslot.ResumeLayout(false);
            this.selectslot.PerformLayout();
            this.Tabage.ResumeLayout(false);
            this.tabPage1.ResumeLayout(false);
            this.tabPage1.PerformLayout();
            this.tabPage2.ResumeLayout(false);
            this.tabPage2.PerformLayout();
            this.tabPage3.ResumeLayout(false);
            this.tabPage3.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.dataGridView1)).EndInit();
            this.groupBox1.ResumeLayout(false);
            this.menuStrip1.ResumeLayout(false);
            this.menuStrip1.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.MonthCalendar deliverydate;
        private System.Windows.Forms.Button button1;
        private System.Windows.Forms.TextBox activity;
        private System.Windows.Forms.RadioButton t10;
        private System.Windows.Forms.RadioButton t12;
        private System.Windows.Forms.RadioButton t16;
        private System.Windows.Forms.RadioButton t14;
        private System.Windows.Forms.RadioButton t20;
        private System.Windows.Forms.RadioButton t18;
        private System.Windows.Forms.GroupBox selectslot;
        private System.Windows.Forms.Button button2;
        private System.Windows.Forms.TabControl Tabage;
        private System.Windows.Forms.TabPage tabPage1;
        private System.Windows.Forms.TabPage tabPage2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.CheckBox wm20;
        private System.Windows.Forms.CheckBox wm18;
        private System.Windows.Forms.CheckBox wm16;
        private System.Windows.Forms.CheckBox wm14;
        private System.Windows.Forms.CheckBox wm12;
        private System.Windows.Forms.CheckBox wm10;
        private System.Windows.Forms.MonthCalendar wmdate;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.Label label6;
        private System.Windows.Forms.TextBox activity2;
        private System.Windows.Forms.Button button3;
        private System.Windows.Forms.Button extactwm;
        private System.Windows.Forms.Button button4;
        private System.ComponentModel.BackgroundWorker backgroundWorker1;
        private System.Windows.Forms.DataGridView dataGridView1;
        private System.Windows.Forms.Button button5;
        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.Button button6;
        private System.Windows.Forms.GroupBox groupBox2;
        private System.Windows.Forms.ComboBox comboBox1;
        private System.Windows.Forms.Button button7;
        private System.Windows.Forms.TabPage tabPage3;
        private System.Windows.Forms.Button button10;
        private System.Windows.Forms.Button uploadsave;
        private System.Windows.Forms.Button button8;
        private System.Windows.Forms.Label label8;
        private System.Windows.Forms.Label label7;
        private System.Windows.Forms.TextBox uploadfile;
        private System.Windows.Forms.TextBox activity3;
        private System.Windows.Forms.Button button9;
        private System.Windows.Forms.ComboBox comboBox2;
        private System.Windows.Forms.MenuStrip menuStrip1;
        private System.Windows.Forms.ToolStripMenuItem unassignOrdersToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem teamAWave1ToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem teamAWave2ToolStripMenuItem;
        private System.Windows.Forms.RadioButton t08;
        private System.Windows.Forms.ToolStripComboBox toolStripComboBox1;
        private System.Windows.Forms.ToolStripTextBox toolStripTextBox1;
        private System.Windows.Forms.ToolStripComboBox toolStripComboBox2;
        private System.Windows.Forms.ToolStripMenuItem unassignToolStripMenuItem;
    }
}

